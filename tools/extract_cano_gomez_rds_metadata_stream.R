#!/usr/bin/env Rscript

# Base-R worker for the checksum-counted GSE318731 streaming extractor.
#
# This worker deliberately has no SeuratObject, jsonlite, or digest dependency.
# A Python transport sends the exact compressed RDS byte stream to stdin while
# counting bytes and calculating SHA-256.  Base R necessarily materializes the
# complete serialized object before this worker can retain only the meta.data
# slot, so CHOL is the required memory probe before either large source is run.
#
# Direct invocation (normally performed by the Python transport):
#   Rscript tools/extract_cano_gomez_rds_metadata_stream.R \
#     CHOL 3199 5 /path/to/new-empty-worker-directory

CONTRACT_VERSION <- "0.1.0"
REQUIRED_ASSIGNMENT_COLUMNS <- c("groups", "neuron_types")
OPTIONAL_CONTEXT_COLUMNS <- c("source", "anatomy", "Sex")
CONTRACT_RAW_COLUMNS <- c(REQUIRED_ASSIGNMENT_COLUMNS, OPTIONAL_CONTEXT_COLUMNS)
PRESERVED_SOURCE_COLUMN_VALUES <- "PRESERVED_SOURCE_COLUMN_VALUES"
ABSENT_SOURCE_COLUMN_TO_SOURCE_NA <-
  "SOURCE_COLUMN_ABSENT_EMITTED_AS_SOURCE_NA"
SOURCE_COLUMN_ABSENCE_REASON <- "source_meta_data_column_absent"
CSV_HEADER <- c(
  "nucleus_id",
  "transmitter_class",
  "group",
  "neuron_type",
  "source",
  "anatomy",
  "sex"
)

abort <- function(format, ...) {
  stop(sprintf(format, ...), call. = FALSE)
}

normalize_utf8 <- function(values, context) {
  original_na <- is.na(values)
  normalized <- enc2utf8(as.character(values))
  if (any(is.na(normalized) & !original_na)) {
    abort("UTF-8 conversion failed for %s.", context)
  }
  normalized
}

csv_encode <- function(values) {
  # Match the established source-roster contract exactly: source NA is the
  # unquoted token NA, while every non-missing value is quoted.  This keeps a
  # literal string "NA", an exact empty string, whitespace, and source NA
  # distinguishable in the byte stream.
  result <- rep("NA", length(values))
  keep <- !is.na(values)
  if (!any(keep)) {
    return(result)
  }

  encoded <- normalize_utf8(values[keep], "CSV values")
  result[keep] <- paste0(
    '"',
    gsub('"', '""', encoded, fixed = TRUE),
    '"'
  )
  result
}

write_csv_columns <- function(columns, path, chunk_size = 10000L) {
  if (length(columns) == 0L || is.null(names(columns))) {
    abort("Refusing to write a CSV without named columns.")
  }
  row_counts <- vapply(columns, length, integer(1))
  if (length(unique(row_counts)) != 1L) {
    abort("CSV columns do not share one row count.")
  }

  connection <- file(path, open = "wb")
  on.exit(close(connection), add = TRUE)
  writeBin(
    charToRaw(paste0(paste(csv_encode(names(columns)), collapse = ","), "\n")),
    connection
  )

  row_count <- row_counts[[1L]]
  if (row_count == 0L) {
    return(invisible(NULL))
  }
  starts <- seq.int(1L, row_count, by = chunk_size)
  for (start in starts) {
    end <- min(start + chunk_size - 1L, row_count)
    indexes <- start:end
    encoded_columns <- lapply(columns, function(column) {
      csv_encode(column[indexes])
    })
    lines <- do.call(paste, c(encoded_columns, sep = ","))
    writeBin(
      charToRaw(enc2utf8(paste0(paste(lines, collapse = "\n"), "\n"))),
      connection
    )
  }
  invisible(NULL)
}

as_raw_strings <- function(values, context) {
  if (!(is.factor(values) || is.character(values))) {
    abort(
      "%s must be factor or character; observed typeof=%s class=%s.",
      context,
      typeof(values),
      paste(class(values), collapse = "/")
    )
  }
  normalize_utf8(as.character(values), context)
}

profile_contract_column <- function(
  raw,
  source_values,
  column_name,
  column_index,
  source_column_present
) {
  non_missing <- raw[!is.na(raw)]
  list(
    source_column_present = if (source_column_present) "true" else "false",
    source_column_index = if (source_column_present) {
      as.character(column_index)
    } else {
      NA_character_
    },
    column_name = column_name,
    emission_mode = if (source_column_present) {
      PRESERVED_SOURCE_COLUMN_VALUES
    } else {
      ABSENT_SOURCE_COLUMN_TO_SOURCE_NA
    },
    source_column_absence_reason = if (source_column_present) {
      NA_character_
    } else {
      SOURCE_COLUMN_ABSENCE_REASON
    },
    typeof = if (source_column_present) typeof(source_values) else NA_character_,
    storage_mode = if (source_column_present) {
      storage.mode(source_values)
    } else {
      NA_character_
    },
    class = if (source_column_present) {
      paste(
        normalize_utf8(class(source_values), "metadata class"),
        collapse = "/"
      )
    } else {
      NA_character_
    },
    is_factor = if (source_column_present) {
      if (is.factor(source_values)) "true" else "false"
    } else {
      NA_character_
    },
    is_ordered_factor = if (source_column_present) {
      if (is.ordered(source_values)) "true" else "false"
    } else {
      NA_character_
    },
    row_count = as.character(length(raw)),
    source_na_count = as.character(sum(is.na(raw))),
    source_empty_string_count = as.character(sum(!is.na(raw) & raw == "")),
    source_whitespace_only_count = as.character(sum(
      !is.na(raw) & raw != "" & trimws(raw) == ""
    )),
    observed_nonempty_unique_count = as.character(length(unique(
      non_missing[non_missing != ""]
    )))
  )
}

arguments <- commandArgs(trailingOnly = TRUE)
if (length(arguments) != 4L) {
  abort(
    paste0(
      "Usage: Rscript tools/extract_cano_gomez_rds_metadata_stream.R ",
      "<CHOL|GABA|GLUT> <expected-rows> <expected-groups> ",
      "<new-empty-worker-directory>"
    )
  )
}

transmitter_class <- arguments[[1L]]
if (!(transmitter_class %in% c("CHOL", "GABA", "GLUT"))) {
  abort("Unsupported transmitter class `%s`.", transmitter_class)
}
expected_rows <- suppressWarnings(as.integer(arguments[[2L]]))
expected_groups <- suppressWarnings(as.integer(arguments[[3L]]))
if (is.na(expected_rows) || expected_rows <= 0L) {
  abort("Expected row count must be a positive integer.")
}
if (is.na(expected_groups) || expected_groups <= 0L) {
  abort("Expected group count must be a positive integer.")
}

output_directory <- arguments[[4L]]
if (!dir.exists(output_directory)) {
  abort("Worker output directory does not exist: %s", output_directory)
}
if (length(list.files(output_directory, all.files = TRUE, no.. = TRUE)) > 0L) {
  abort("Worker output directory is not empty: %s", output_directory)
}

raw_stdin <- file("stdin", open = "rb")
compressed_stdin <- gzcon(raw_stdin, allowNonCompressed = FALSE, text = FALSE)
object <- tryCatch(
  readRDS(compressed_stdin),
  error = function(error) {
    abort("Could not deserialize streamed RDS: %s", conditionMessage(error))
  }
)
close(compressed_stdin)

# S4 slots are serialized as attributes.  attr() is intentionally used here:
# it can read this one slot without loading the SeuratObject class definition.
object_class <- normalize_utf8(class(object), "object class")
if (!isS4(object) || !("Seurat" %in% object_class)) {
  abort(
    "Stream did not deserialize to an S4 Seurat object (class=%s; isS4=%s).",
    paste(object_class, collapse = "/"),
    isS4(object)
  )
}
metadata <- attr(object, "meta.data", exact = TRUE)
if (!is.data.frame(metadata)) {
  abort("The streamed Seurat object has no data.frame `meta.data` attribute.")
}

# Release the assay/reduction/graph payload before profiling and writing rows.
# The complete object was still materialized by readRDS; this is not a partial
# RDS parser and the receipt must not claim otherwise.
rm(object)
invisible(gc(verbose = FALSE))

if (nrow(metadata) != expected_rows) {
  abort(
    "meta.data row denominator changed (expected=%d, observed=%d).",
    expected_rows,
    nrow(metadata)
  )
}
metadata_names <- colnames(metadata)
if (
  is.null(metadata_names) ||
    any(is.na(metadata_names)) ||
    any(!nzchar(metadata_names)) ||
    anyDuplicated(metadata_names) > 0L
) {
  abort("meta.data has missing, empty, or duplicate column names.")
}
metadata_names <- normalize_utf8(metadata_names, "metadata column names")
# The verified GLUT UPDATE object has no meta.data neuron_types column.
# Preserve that absence; active.ident is a different slot and is never copied
# into metadata. Python independently pins the exact source SHA-256 before
# accepting this one source-specific exception.
if (transmitter_class == "GLUT" && !("neuron_types" %in% metadata_names)) {
  REQUIRED_ASSIGNMENT_COLUMNS <- "groups"
}
missing_required <- setdiff(REQUIRED_ASSIGNMENT_COLUMNS, metadata_names)
if (length(missing_required) > 0L) {
  abort(
    "meta.data lacks required assignment column(s): %s.",
    paste(missing_required, collapse = ", ")
  )
}

nuclei <- rownames(metadata)
if (
  is.null(nuclei) ||
    length(nuclei) != expected_rows ||
    any(is.na(nuclei)) ||
    any(!nzchar(nuclei)) ||
    anyDuplicated(nuclei) > 0L
) {
  abort("meta.data row.names are missing, empty, or non-unique.")
}
nuclei <- normalize_utf8(nuclei, "meta.data row.names")
if (any(grepl("|", nuclei, fixed = TRUE))) {
  abort("A meta.data row.name contains the reserved compound-key delimiter `|`.")
}

source_column_presence <- setNames(
  CONTRACT_RAW_COLUMNS %in% metadata_names,
  CONTRACT_RAW_COLUMNS
)
raw_values <- lapply(CONTRACT_RAW_COLUMNS, function(column_name) {
  if (source_column_presence[[column_name]]) {
    as_raw_strings(metadata[[column_name]], paste0("raw `", column_name, "`"))
  } else {
    # Optional context is not guessed from another column or from the filename.
    # Its contracted output field is source NA for every row, and the worker
    # profile below records that the source column itself was absent.
    rep(NA_character_, expected_rows)
  }
})
names(raw_values) <- CONTRACT_RAW_COLUMNS
groups <- raw_values[["groups"]]
if (any(is.na(groups)) || any(groups == "")) {
  abort("Raw `groups` contains a missing or empty assignment.")
}
observed_groups <- sort(unique(groups), method = "radix")
if (length(observed_groups) != expected_groups) {
  abort(
    "Group denominator changed (expected=%d, observed=%d).",
    expected_groups,
    length(observed_groups)
  )
}

write_csv_columns(
  list(
    nucleus_id = nuclei,
    transmitter_class = rep(transmitter_class, expected_rows),
    group = raw_values[["groups"]],
    neuron_type = raw_values[["neuron_types"]],
    source = raw_values[["source"]],
    anatomy = raw_values[["anatomy"]],
    sex = raw_values[["Sex"]]
  ),
  file.path(output_directory, "metadata.csv")
)

column_inventory <- lapply(seq_along(metadata_names), function(index) {
  column <- metadata[[index]]
  list(
    source_column_index = as.character(index),
    column_name = metadata_names[[index]],
    typeof = typeof(column),
    storage_mode = storage.mode(column),
    class = paste(normalize_utf8(class(column), "metadata class"), collapse = "/"),
    is_factor = if (is.factor(column)) "true" else "false",
    is_ordered_factor = if (is.ordered(column)) "true" else "false"
  )
})
write_csv_columns(
  lapply(names(column_inventory[[1L]]), function(field) {
    vapply(column_inventory, `[[`, character(1), field)
  }) |> setNames(names(column_inventory[[1L]])),
  file.path(output_directory, "columns.csv")
)

required_profiles <- lapply(seq_along(CONTRACT_RAW_COLUMNS), function(index) {
  column_name <- CONTRACT_RAW_COLUMNS[[index]]
  source_column_present <- source_column_presence[[column_name]]
  profile_contract_column(
    raw_values[[column_name]],
    if (source_column_present) metadata[[column_name]] else NULL,
    column_name,
    if (source_column_present) match(column_name, metadata_names) else NA_integer_,
    source_column_present
  )
})
write_csv_columns(
  lapply(names(required_profiles[[1L]]), function(field) {
    vapply(required_profiles, `[[`, character(1), field)
  }) |> setNames(names(required_profiles[[1L]])),
  file.path(output_directory, "required_profiles.csv")
)

level_rows <- list()
level_row_index <- 0L
for (column_name in CONTRACT_RAW_COLUMNS) {
  source_column_present <- source_column_presence[[column_name]]
  column <- if (source_column_present) metadata[[column_name]] else NULL
  if (source_column_present && is.factor(column)) {
    factor_levels <- normalize_utf8(levels(column), paste0(column_name, " levels"))
    serialized <- raw_values[[column_name]]
    for (level_index in seq_along(factor_levels)) {
      level <- factor_levels[[level_index]]
      level_row_index <- level_row_index + 1L
      level_rows[[level_row_index]] <- list(
        column_name = column_name,
        level_index = as.character(level_index),
        level = level,
        observed_count = as.character(if (is.na(level)) {
          sum(is.na(serialized))
        } else {
          sum(!is.na(serialized) & serialized == level)
        })
      )
    }
  }
}
if (length(level_rows) == 0L) {
  write_csv_columns(
    list(
      column_name = character(0),
      level_index = character(0),
      level = character(0),
      observed_count = character(0)
    ),
    file.path(output_directory, "factor_levels.csv")
  )
} else {
  write_csv_columns(
    lapply(names(level_rows[[1L]]), function(field) {
      vapply(level_rows, `[[`, character(1), field)
    }) |> setNames(names(level_rows[[1L]])),
    file.path(output_directory, "factor_levels.csv")
  )
}

worker_receipt <- list(
  contract_version = CONTRACT_VERSION,
  r_version = as.character(getRversion()),
  r_platform = R.version$platform,
  object_class = paste(object_class, collapse = "/"),
  object_is_s4 = "true",
  metadata_access = "attr(object, meta.data, exact=TRUE)",
  metadata_rows = as.character(expected_rows),
  metadata_columns = as.character(length(metadata_names)),
  required_assignment_columns = paste(
    REQUIRED_ASSIGNMENT_COLUMNS,
    collapse = "|"
  ),
  optional_context_columns = paste(OPTIONAL_CONTEXT_COLUMNS, collapse = "|"),
  present_optional_context_columns = paste(
    OPTIONAL_CONTEXT_COLUMNS[source_column_presence[OPTIONAL_CONTEXT_COLUMNS]],
    collapse = "|"
  ),
  absent_optional_context_columns = paste(
    OPTIONAL_CONTEXT_COLUMNS[!source_column_presence[OPTIONAL_CONTEXT_COLUMNS]],
    collapse = "|"
  ),
  absent_optional_context_emitted_as_source_na = "true",
  observed_groups = as.character(length(observed_groups)),
  observed_nonempty_neuron_types = as.character(length(unique(
    raw_values[["neuron_types"]][
      !is.na(raw_values[["neuron_types"]]) &
        raw_values[["neuron_types"]] != ""
    ]
  ))),
  base_r_only = "true",
  complete_object_materialized_by_read_rds = "true",
  seurat_object_namespace_loaded = "false",
  cross_assay_cell_identity_verified = "false",
  same_cell_claim_authorized = "false",
  geometry_claim_authorized = "false",
  internal_structure_claim_authorized = "false"
)
write_csv_columns(
  lapply(worker_receipt, function(value) as.character(value)),
  file.path(output_directory, "worker_receipt.csv")
)

quit(save = "no", status = 0L, runLast = FALSE)
