#!/usr/bin/env Rscript

# Deterministic, source-side metadata extraction for the three public
# Cano-Gomez et al. GSE318731 Seurat objects.
#
# Required runtime:
#   - R >= 4.2
#   - R packages: SeuratObject, jsonlite, digest
#   - gzip with support for `-n -9 -c`
#
# Usage (the positional order and exact basenames are part of the contract):
#   Rscript tools/extract_cano_gomez_multiome_metadata.R \
#     /path/GSE318731_P56_cholinergic_multiome.rds \
#     /path/GSE318731_P56_gabaergic_multiome.rds \
#     /path/GSE318731_P56_glutamatergic_multiome_UPDATE.rds \
#     /path/to/new-output-directory
#
# The output directory must not already exist. This prevents an interrupted or
# stale extraction from being silently mixed with a new receipt set.

CONTRACT_VERSION <- "1.0.0"
ACCESSION <- "GSE318731"
REPORTED_TYPE_TOTAL_NOT_ASSERTED <- 516L
REQUIRED_PACKAGES <- c("SeuratObject", "jsonlite", "digest")

SOURCE_SPECS <- list(
  list(
    object_id = "cholinergic",
    file_name = "GSE318731_P56_cholinergic_multiome.rds",
    source_url = paste0(
      "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE318nnn/GSE318731/suppl/",
      "GSE318731_P56_cholinergic_multiome.rds"
    ),
    expected_bytes = 127862795,
    expected_nuclei = 3199L,
    expected_groups = 5L
  ),
  list(
    object_id = "gabaergic",
    file_name = "GSE318731_P56_gabaergic_multiome.rds",
    source_url = paste0(
      "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE318nnn/GSE318731/suppl/",
      "GSE318731_P56_gabaergic_multiome.rds"
    ),
    expected_bytes = 1646402816,
    expected_nuclei = 73364L,
    expected_groups = 24L
  ),
  list(
    object_id = "glutamatergic",
    file_name = "GSE318731_P56_glutamatergic_multiome_UPDATE.rds",
    source_url = paste0(
      "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE318nnn/GSE318731/suppl/",
      "GSE318731_P56_glutamatergic_multiome_UPDATE.rds"
    ),
    expected_bytes = 1832005077,
    expected_nuclei = 92782L,
    expected_groups = 28L
  )
)

EXPECTED_TOTAL_NUCLEI <- 169345L
EXPECTED_TOTAL_GROUPS <- 57L
REQUIRED_RAW_METADATA_COLUMNS <- c("groups", "neuron_types")
RESERVED_ROSTER_COLUMNS <- c(
  "source_accession",
  "source_file_name",
  "compound_nucleus_key",
  "source_nucleus_id",
  "source_active_assay",
  "source_active_ident"
)

abort <- function(format, ...) {
  stop(sprintf(format, ...), call. = FALSE)
}

require_runtime <- function() {
  if (getRversion() < "4.2.0") {
    abort(
      "R >= 4.2.0 is required; observed R %s.",
      as.character(getRversion())
    )
  }

  missing_packages <- REQUIRED_PACKAGES[!vapply(
    REQUIRED_PACKAGES,
    requireNamespace,
    quietly = TRUE,
    FUN.VALUE = logical(1)
  )]

  if (length(missing_packages) > 0L) {
    abort(
      paste0(
        "Missing required R package(s): %s. Install the exact extraction ",
        "runtime before retrying; this script will not install packages."
      ),
      paste(missing_packages, collapse = ", ")
    )
  }

  gzip_path <- Sys.which("gzip")
  if (!nzchar(gzip_path)) {
    abort(
      paste0(
        "Required executable `gzip` was not found. A gzip implementation ",
        "supporting -n -9 -c is required for deterministic CSV.gz output."
      )
    )
  }

  gzip_path
}

set_deterministic_locale <- function() {
  old_collate <- Sys.getlocale("LC_COLLATE")
  old_numeric <- Sys.getlocale("LC_NUMERIC")
  old_options <- options(digits = 17L, OutDec = ".", scipen = 0L)

  collate_result <- suppressWarnings(Sys.setlocale("LC_COLLATE", "C"))
  numeric_result <- suppressWarnings(Sys.setlocale("LC_NUMERIC", "C"))
  if (!identical(collate_result, "C") || !identical(numeric_result, "C")) {
    abort(
      paste0(
        "Could not activate the C collation and numeric locales required ",
        "for deterministic sorting and numeric serialization."
      )
    )
  }

  list(
    collate = old_collate,
    numeric = old_numeric,
    options = old_options
  )
}

restore_locale <- function(state) {
  suppressWarnings(Sys.setlocale("LC_COLLATE", state$collate))
  suppressWarnings(Sys.setlocale("LC_NUMERIC", state$numeric))
  options(state$options)
  invisible(NULL)
}

normalize_utf8 <- function(values, context) {
  if (length(values) == 0L) {
    return(as.character(values))
  }

  original_na <- is.na(values)
  normalized <- enc2utf8(as.character(values))
  conversion_failures <- is.na(normalized) & !original_na
  if (any(conversion_failures)) {
    abort("UTF-8 conversion failed for %s.", context)
  }

  normalized
}

sort_utf8 <- function(values) {
  sort(unique(normalize_utf8(values, "sorted values")), method = "radix")
}

sha256_file <- function(path) {
  unname(digest::digest(file = path, algo = "sha256", serialize = FALSE))
}

sha256_lines <- function(values) {
  values <- normalize_utf8(values, "receipt hash values")
  payload <- if (length(values) == 0L) "" else paste0(
    paste(values, collapse = "\n"),
    "\n"
  )
  unname(digest::digest(charToRaw(payload), algo = "sha256", serialize = FALSE))
}

assert_identical_order <- function(actual, expected, context) {
  actual <- normalize_utf8(actual, paste0(context, " actual identifiers"))
  expected <- normalize_utf8(expected, paste0(context, " expected identifiers"))

  if (!identical(actual, expected)) {
    first_difference <- which(actual != expected)[1L]
    if (length(actual) != length(expected)) {
      first_difference <- min(length(actual), length(expected)) + 1L
    } else if (is.na(first_difference)) {
      first_difference <- 1L
    }

    abort(
      "%s identity/order mismatch (actual=%d, expected=%d, first difference=%d).",
      context,
      length(actual),
      length(expected),
      first_difference
    )
  }

  invisible(TRUE)
}

is_supported_metadata_column <- function(values) {
  is.factor(values) ||
    is.character(values) ||
    is.integer(values) ||
    is.double(values) ||
    is.logical(values)
}

as_receipt_strings <- function(values, context) {
  if (is.factor(values) || is.character(values)) {
    return(normalize_utf8(as.character(values), context))
  }

  if (is.integer(values)) {
    result <- rep(NA_character_, length(values))
    keep <- !is.na(values)
    result[keep] <- format(values[keep], scientific = FALSE, trim = TRUE)
    return(result)
  }

  if (is.double(values)) {
    result <- rep(NA_character_, length(values))
    keep <- !is.na(values)
    result[keep] <- sprintf("%.17g", values[keep])
    return(result)
  }

  if (is.logical(values)) {
    result <- rep(NA_character_, length(values))
    keep <- !is.na(values)
    result[keep] <- ifelse(values[keep], "TRUE", "FALSE")
    return(result)
  }

  abort(
    "%s uses unsupported metadata storage (typeof=%s; class=%s).",
    context,
    typeof(values),
    paste(class(values), collapse = "/")
  )
}

count_values <- function(values) {
  observed <- values[!is.na(values)]
  if (length(observed) == 0L) {
    return(list())
  }

  counts <- table(observed, useNA = "no")
  labels <- normalize_utf8(names(counts), "observed value labels")
  order_index <- order(labels, method = "radix")

  lapply(order_index, function(index) {
    list(
      value = labels[[index]],
      count = as.integer(counts[[index]])
    )
  })
}

profile_column <- function(values, column_name, column_index) {
  context <- sprintf("metadata column %d `%s`", column_index, column_name)
  if (!is_supported_metadata_column(values)) {
    abort(
      "%s uses unsupported metadata storage (typeof=%s; class=%s).",
      context,
      typeof(values),
      paste(class(values), collapse = "/")
    )
  }

  serialized <- as_receipt_strings(values, context)
  factor_levels <- if (is.factor(values)) {
    normalize_utf8(levels(values), paste0(context, " factor levels"))
  } else {
    character(0)
  }
  observed_factor_values <- if (is.factor(values)) {
    unique(serialized[!is.na(serialized)])
  } else {
    character(0)
  }
  zero_count_levels <- if (is.factor(values)) {
    factor_levels[!(factor_levels %in% observed_factor_values)]
  } else {
    character(0)
  }
  is_textual <- is.factor(values) || is.character(values)

  list(
    source_column_index = as.integer(column_index),
    column_name = normalize_utf8(column_name, context),
    typeof = typeof(values),
    storage_mode = storage.mode(values),
    class = normalize_utf8(class(values), paste0(context, " class")),
    is_factor = is.factor(values),
    is_ordered_factor = is.ordered(values),
    factor_levels = as.list(factor_levels),
    row_count = length(values),
    observed_non_missing_count = sum(!is.na(serialized)),
    observed_unique_count = length(unique(serialized[!is.na(serialized)])),
    na_count = sum(is.na(serialized)),
    empty_string_count = if (is_textual) {
      sum(!is.na(serialized) & serialized == "")
    } else {
      0L
    },
    whitespace_only_count = if (is_textual) {
      sum(
        !is.na(serialized) &
          serialized != "" &
          trimws(serialized) == ""
      )
    } else {
      0L
    },
    zero_count_levels = as.list(zero_count_levels),
    observed_value_counts = count_values(serialized)
  )
}

normalize_metadata_for_roster <- function(metadata) {
  normalized <- vector("list", ncol(metadata))
  names(normalized) <- normalize_utf8(
    colnames(metadata),
    "metadata column names"
  )

  for (index in seq_len(ncol(metadata))) {
    column_name <- names(normalized)[[index]]
    normalized[[index]] <- as_receipt_strings(
      metadata[[index]],
      sprintf("metadata column %d `%s`", index, column_name)
    )
  }

  normalized
}

csv_quote <- function(values) {
  result <- rep("NA", length(values))
  keep <- !is.na(values)
  escaped <- gsub('"', '""', values[keep], fixed = TRUE)
  result[keep] <- paste0('"', escaped, '"')
  result
}

write_deterministic_csv <- function(columns, path, chunk_size = 10000L) {
  if (length(columns) == 0L) {
    abort("Refusing to write a roster with no columns.")
  }

  row_counts <- vapply(columns, length, integer(1))
  if (length(unique(row_counts)) != 1L) {
    abort("Roster columns do not have one common row count.")
  }

  connection <- file(path, open = "wb")
  on.exit(close(connection), add = TRUE)

  header <- paste(csv_quote(names(columns)), collapse = ",")
  writeBin(charToRaw(paste0(header, "\n")), connection)

  row_count <- row_counts[[1L]]
  if (row_count == 0L) {
    return(invisible(NULL))
  }

  starts <- seq.int(1L, row_count, by = chunk_size)
  for (start in starts) {
    end <- min(start + chunk_size - 1L, row_count)
    row_index <- start:end
    encoded_columns <- lapply(columns, function(values) {
      csv_quote(values[row_index])
    })
    lines <- do.call(paste, c(encoded_columns, sep = ","))
    payload <- paste0(paste(lines, collapse = "\n"), "\n")
    writeBin(charToRaw(enc2utf8(payload)), connection)
  }

  invisible(NULL)
}

gzip_deterministic <- function(gzip_path, input_path, output_path) {
  stderr_path <- paste0(output_path, ".gzip-stderr")
  on.exit(unlink(stderr_path, force = TRUE), add = TRUE)

  status <- system2(
    gzip_path,
    args = c("-n", "-9", "-c", shQuote(input_path)),
    stdout = output_path,
    stderr = stderr_path
  )

  if (!identical(status, 0L) || !file.exists(output_path)) {
    details <- if (file.exists(stderr_path)) {
      paste(readLines(stderr_path, warn = FALSE), collapse = " ")
    } else {
      "no gzip stderr was captured"
    }
    abort("Deterministic gzip compression failed: %s", details)
  }

  invisible(NULL)
}

write_deterministic_json <- function(value, path) {
  payload <- jsonlite::toJSON(
    value,
    auto_unbox = TRUE,
    pretty = TRUE,
    null = "null",
    na = "null",
    digits = NA
  )
  payload <- paste0(enc2utf8(payload), "\n")
  connection <- file(path, open = "wb")
  on.exit(close(connection), add = TRUE)
  writeBin(charToRaw(payload), connection)
  invisible(NULL)
}

validate_source_path <- function(path, spec) {
  if (!file.exists(path) || dir.exists(path)) {
    abort("Input RDS does not exist as a regular file: %s", path)
  }

  normalized <- normalizePath(path, mustWork = TRUE)
  observed_name <- basename(normalized)
  if (!identical(observed_name, spec$file_name)) {
    abort(
      "Expected source basename `%s`; received `%s`.",
      spec$file_name,
      observed_name
    )
  }

  observed_bytes <- unname(file.info(normalized)$size)
  if (is.na(observed_bytes) || observed_bytes != spec$expected_bytes) {
    abort(
      "Source byte-size mismatch for `%s` (expected=%.0f, observed=%.0f).",
      spec$file_name,
      spec$expected_bytes,
      observed_bytes
    )
  }

  normalized
}

read_and_validate_object <- function(source_path, spec) {
  object <- readRDS(source_path)
  if (!inherits(object, "Seurat")) {
    abort(
      "`%s` did not deserialize to a Seurat object (class=%s).",
      spec$file_name,
      paste(class(object), collapse = "/")
    )
  }

  metadata <- object[[]]
  if (!is.data.frame(metadata)) {
    abort("`%s` meta.data is not a data.frame.", spec$file_name)
  }
  if (nrow(metadata) != spec$expected_nuclei) {
    abort(
      "Nucleus-count mismatch for `%s` (expected=%d, observed=%d).",
      spec$file_name,
      spec$expected_nuclei,
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
    abort("`%s` has missing, empty, or duplicate metadata column names.", spec$file_name)
  }
  metadata_names <- normalize_utf8(metadata_names, "metadata column names")
  missing_required <- setdiff(REQUIRED_RAW_METADATA_COLUMNS, metadata_names)
  if (length(missing_required) > 0L) {
    abort(
      "`%s` lacks required raw metadata column(s): %s.",
      spec$file_name,
      paste(missing_required, collapse = ", ")
    )
  }
  collisions <- intersect(metadata_names, RESERVED_ROSTER_COLUMNS)
  if (length(collisions) > 0L) {
    abort(
      "`%s` metadata collides with reserved roster column(s): %s.",
      spec$file_name,
      paste(collisions, collapse = ", ")
    )
  }

  nuclei <- rownames(metadata)
  if (
    is.null(nuclei) ||
      length(nuclei) != nrow(metadata) ||
      any(is.na(nuclei)) ||
      any(!nzchar(nuclei)) ||
      anyDuplicated(nuclei) > 0L
  ) {
    abort(
      "`%s` meta.data row.names are absent, empty, or non-unique.",
      spec$file_name
    )
  }
  nuclei <- normalize_utf8(nuclei, "meta.data row.names")
  if (any(grepl("|", nuclei, fixed = TRUE))) {
    abort(
      "`%s` contains a row.name with `|`, which is reserved by the compound key.",
      spec$file_name
    )
  }

  object_cells <- SeuratObject::Cells(object)
  assert_identical_order(
    object_cells,
    nuclei,
    sprintf("%s SeuratObject::Cells(object)", spec$file_name)
  )
  assert_identical_order(
    colnames(object),
    nuclei,
    sprintf("%s colnames(object)", spec$file_name)
  )

  assay_names <- SeuratObject::Assays(object)
  if (length(assay_names) == 0L) {
    abort("`%s` has no assays.", spec$file_name)
  }
  assay_names <- normalize_utf8(assay_names, "assay names")
  assay_receipts <- lapply(assay_names, function(assay_name) {
    assay_cells <- colnames(object[[assay_name]])
    if (is.null(assay_cells)) {
      abort(
        "Assay `%s` in `%s` has no colnames.",
        assay_name,
        spec$file_name
      )
    }
    assert_identical_order(
      assay_cells,
      nuclei,
      sprintf("%s assay `%s` colnames", spec$file_name, assay_name)
    )
    list(
      assay_name = assay_name,
      cell_count = length(assay_cells),
      colnames_match_meta_data_row_names_exactly = TRUE,
      ordered_colnames_sha256 = sha256_lines(assay_cells)
    )
  })

  active_assay <- normalize_utf8(
    SeuratObject::DefaultAssay(object),
    "active assay"
  )
  if (length(active_assay) != 1L || !(active_assay %in% assay_names)) {
    abort("`%s` has an invalid active assay.", spec$file_name)
  }

  active_ident <- SeuratObject::Idents(object)
  if (length(active_ident) != length(nuclei)) {
    abort(
      "`%s` active ident length does not match meta.data row count.",
      spec$file_name
    )
  }
  if (is.null(names(active_ident))) {
    abort("`%s` active ident has no cell names.", spec$file_name)
  }
  assert_identical_order(
    names(active_ident),
    nuclei,
    sprintf("%s names(Idents(object))", spec$file_name)
  )

  metadata_profiles <- lapply(seq_len(ncol(metadata)), function(index) {
    profile_column(metadata[[index]], metadata_names[[index]], index)
  })
  names(metadata) <- metadata_names

  group_strings <- as_receipt_strings(
    metadata[["groups"]],
    sprintf("%s raw groups", spec$file_name)
  )
  if (any(is.na(group_strings)) || any(group_strings == "")) {
    abort(
      "`%s` raw `groups` contains NA or empty labels; exact group assignment failed.",
      spec$file_name
    )
  }
  observed_groups <- sort_utf8(group_strings)
  if (length(observed_groups) != spec$expected_groups) {
    abort(
      "Group-count mismatch for `%s` (expected=%d, observed=%d).",
      spec$file_name,
      spec$expected_groups,
      length(observed_groups)
    )
  }

  type_strings <- as_receipt_strings(
    metadata[["neuron_types"]],
    sprintf("%s raw neuron_types", spec$file_name)
  )
  nonempty_types <- type_strings[
    !is.na(type_strings) & type_strings != ""
  ]

  list(
    object = object,
    metadata = metadata,
    nuclei = nuclei,
    assay_receipts = assay_receipts,
    assay_names = assay_names,
    active_assay = active_assay,
    active_ident = active_ident,
    metadata_profiles = metadata_profiles,
    observed_groups = observed_groups,
    type_strings = type_strings,
    observed_types = sort_utf8(nonempty_types)
  )
}

extract_one_source <- function(source_path, spec, staging_dir, gzip_path) {
  source_bytes <- unname(file.info(source_path)$size)
  source_sha256 <- sha256_file(source_path)
  validated <- read_and_validate_object(source_path, spec)

  compound_keys <- paste(
    ACCESSION,
    spec$file_name,
    validated$nuclei,
    sep = "|"
  )
  if (anyDuplicated(compound_keys) > 0L) {
    abort("Compound nucleus keys are not unique for `%s`.", spec$file_name)
  }

  metadata_columns <- normalize_metadata_for_roster(validated$metadata)
  active_ident_strings <- as_receipt_strings(
    validated$active_ident,
    sprintf("%s active ident", spec$file_name)
  )
  roster_columns <- c(
    list(
      source_accession = rep(ACCESSION, length(validated$nuclei)),
      source_file_name = rep(spec$file_name, length(validated$nuclei)),
      compound_nucleus_key = compound_keys,
      source_nucleus_id = validated$nuclei,
      source_active_assay = rep(validated$active_assay, length(validated$nuclei)),
      source_active_ident = active_ident_strings
    ),
    metadata_columns
  )

  roster_name <- sprintf(
    "%s_%s_multiome.metadata.csv.gz",
    ACCESSION,
    spec$object_id
  )
  roster_path <- file.path(staging_dir, roster_name)
  plain_path <- paste0(roster_path, ".plain.csv")
  on.exit(unlink(plain_path, force = TRUE), add = TRUE)

  write_deterministic_csv(roster_columns, plain_path)
  plain_bytes <- unname(file.info(plain_path)$size)
  plain_sha256 <- sha256_file(plain_path)
  gzip_deterministic(gzip_path, plain_path, roster_path)
  compressed_bytes <- unname(file.info(roster_path)$size)
  compressed_sha256 <- sha256_file(roster_path)
  unlink(plain_path, force = TRUE)

  group_profile <- profile_column(
    validated$metadata[["groups"]],
    "groups",
    match("groups", colnames(validated$metadata))
  )
  type_profile <- profile_column(
    validated$metadata[["neuron_types"]],
    "neuron_types",
    match("neuron_types", colnames(validated$metadata))
  )
  active_ident_profile <- profile_column(
    validated$active_ident,
    "active_ident",
    0L
  )

  receipt <- list(
    format_version = CONTRACT_VERSION,
    receipt_kind = "cano_gomez_multiome_raw_metadata_source_receipt",
    accession = ACCESSION,
    source = list(
      file_name = spec$file_name,
      public_url = spec$source_url,
      expected_bytes = spec$expected_bytes,
      observed_bytes = source_bytes,
      sha256 = source_sha256
    ),
    source_object = list(
      object_id = spec$object_id,
      expected_nucleus_count = spec$expected_nuclei,
      observed_nucleus_count = length(validated$nuclei),
      meta_data_row_names_nonempty = TRUE,
      meta_data_row_names_unique = TRUE,
      ordered_row_names_sha256 = sha256_lines(validated$nuclei),
      cells_match_meta_data_row_names_exactly = TRUE,
      object_colnames_match_meta_data_row_names_exactly = TRUE,
      assays = validated$assay_receipts,
      active_assay = validated$active_assay,
      active_ident_names_match_meta_data_row_names_exactly = TRUE,
      active_ident_profile = active_ident_profile
    ),
    raw_label_denominators = list(
      group_column = "groups",
      expected_group_count = spec$expected_groups,
      observed_group_count = length(validated$observed_groups),
      observed_group_labels = as.list(validated$observed_groups),
      neuron_type_column = "neuron_types",
      observed_non_missing_non_empty_type_count = length(validated$observed_types),
      observed_type_labels = as.list(validated$observed_types),
      groups_profile = group_profile,
      neuron_types_profile = type_profile
    ),
    metadata_columns = validated$metadata_profiles,
    roster = list(
      file_name = roster_name,
      media_type = "text/csv",
      content_encoding = "gzip",
      deterministic_compression = "gzip -n -9 -c",
      row_count = length(validated$nuclei),
      column_count = length(roster_columns),
      ordered_column_names = as.list(names(roster_columns)),
      compound_key_expression = "GSE318731|exact source filename|row.name",
      ordered_compound_keys_sha256 = sha256_lines(compound_keys),
      uncompressed_bytes = plain_bytes,
      uncompressed_sha256 = plain_sha256,
      compressed_bytes = compressed_bytes,
      compressed_sha256 = compressed_sha256
    ),
    scope_boundaries = list(
      raw_labels_preserved = TRUE,
      classification_inference_applied = FALSE,
      label_normalization_applied = FALSE,
      reported_516_type_denominator_hard_assertion_applied = FALSE
    )
  )

  receipt_name <- sprintf(
    "%s_%s_multiome.metadata.receipt.json",
    ACCESSION,
    spec$object_id
  )
  receipt_path <- file.path(staging_dir, receipt_name)
  write_deterministic_json(receipt, receipt_path)

  result <- list(
    object_id = spec$object_id,
    source_file_name = spec$file_name,
    nucleus_count = length(validated$nuclei),
    group_count = length(validated$observed_groups),
    observed_groups = validated$observed_groups,
    observed_types = validated$observed_types,
    type_na_count = sum(is.na(validated$type_strings)),
    type_empty_count = sum(
      !is.na(validated$type_strings) & validated$type_strings == ""
    ),
    roster_file_name = roster_name,
    roster_sha256 = compressed_sha256,
    receipt_file_name = receipt_name,
    receipt_sha256 = sha256_file(receipt_path)
  )

  rm(validated)
  gc(verbose = FALSE)
  result
}

prepare_staging_directory <- function(output_argument) {
  expanded_output <- path.expand(output_argument)
  if (file.exists(expanded_output) || dir.exists(expanded_output)) {
    abort(
      paste0(
        "Output path already exists: %s. Choose a new directory so stale ",
        "and current receipts cannot be mixed."
      ),
      expanded_output
    )
  }

  output_parent <- dirname(expanded_output)
  if (!dir.exists(output_parent)) {
    if (!dir.create(output_parent, recursive = TRUE, showWarnings = FALSE)) {
      abort("Could not create output parent directory: %s", output_parent)
    }
  }
  output_parent <- normalizePath(output_parent, mustWork = TRUE)
  output_name <- basename(expanded_output)
  if (!nzchar(output_name) || output_name %in% c(".", "..")) {
    abort("Output directory must have a concrete final path component.")
  }

  final_output <- file.path(output_parent, output_name)
  staging <- file.path(
    output_parent,
    sprintf(".%s.staging-%d", output_name, Sys.getpid())
  )
  if (file.exists(staging) || dir.exists(staging)) {
    abort("Staging path already exists: %s", staging)
  }
  if (!dir.create(staging, recursive = FALSE, showWarnings = FALSE)) {
    abort("Could not create staging directory: %s", staging)
  }

  list(staging = staging, final = final_output)
}

build_combined_receipt <- function(results, staging_dir) {
  total_nuclei <- sum(vapply(results, `[[`, integer(1), "nucleus_count"))
  if (total_nuclei != EXPECTED_TOTAL_NUCLEI) {
    abort(
      "Total nucleus-count mismatch (expected=%d, observed=%d).",
      EXPECTED_TOTAL_NUCLEI,
      total_nuclei
    )
  }

  per_source_group_total <- sum(vapply(results, `[[`, integer(1), "group_count"))
  observed_raw_groups <- sort_utf8(unlist(
    lapply(results, `[[`, "observed_groups"),
    use.names = FALSE
  ))
  source_scoped_group_keys <- sort_utf8(unlist(lapply(results, function(result) {
    paste(result$source_file_name, result$observed_groups, sep = "|")
  }), use.names = FALSE))
  if (
    per_source_group_total != EXPECTED_TOTAL_GROUPS ||
      length(source_scoped_group_keys) != EXPECTED_TOTAL_GROUPS
  ) {
    abort(
      paste0(
        "Total group-count mismatch (expected=%d, per-source sum=%d, ",
        "source-scoped union=%d)."
      ),
      EXPECTED_TOTAL_GROUPS,
      per_source_group_total,
      length(source_scoped_group_keys)
    )
  }

  observed_types <- sort_utf8(unlist(
    lapply(results, `[[`, "observed_types"),
    use.names = FALSE
  ))
  type_na_count <- sum(vapply(results, `[[`, integer(1), "type_na_count"))
  type_empty_count <- sum(vapply(results, `[[`, integer(1), "type_empty_count"))
  matches_reported_type_total <-
    length(observed_types) == REPORTED_TYPE_TOTAL_NOT_ASSERTED &&
    type_na_count == 0L &&
    type_empty_count == 0L

  source_summaries <- lapply(results, function(result) {
    list(
      object_id = result$object_id,
      source_file_name = result$source_file_name,
      nucleus_count = result$nucleus_count,
      group_count = result$group_count,
      roster_file_name = result$roster_file_name,
      roster_sha256 = result$roster_sha256,
      receipt_file_name = result$receipt_file_name,
      receipt_sha256 = result$receipt_sha256
    )
  })

  combined_receipt <- list(
    format_version = CONTRACT_VERSION,
    receipt_kind = "cano_gomez_multiome_raw_metadata_combined_receipt",
    accession = ACCESSION,
    source_objects = source_summaries,
    asserted_denominators = list(
      nucleus_counts_by_source = list(
        cholinergic = 3199L,
        gabaergic = 73364L,
        glutamatergic = 92782L
      ),
      total_nucleus_count = EXPECTED_TOTAL_NUCLEI,
      group_counts_by_source = list(
        cholinergic = 5L,
        gabaergic = 24L,
        glutamatergic = 28L
      ),
      total_source_scoped_group_count = EXPECTED_TOTAL_GROUPS,
      observed_source_scoped_group_keys = as.list(source_scoped_group_keys),
      observed_raw_group_label_union_count = length(observed_raw_groups),
      observed_raw_group_label_union = as.list(observed_raw_groups)
    ),
    reported_type_denominator_reconciliation = list(
      reported_expected_unique_type_count = REPORTED_TYPE_TOTAL_NOT_ASSERTED,
      observed_unique_non_missing_non_empty_type_count = length(observed_types),
      observed_type_na_count = type_na_count,
      observed_type_empty_count = type_empty_count,
      observed_type_labels = as.list(observed_types),
      matches_reported_denominator_and_has_no_missing_labels =
        matches_reported_type_total,
      hard_assertion_applied = FALSE,
      interpretation = paste0(
        "The observed raw union is recorded for reconciliation. The reported ",
        "516 denominator is not a pass/fail assertion and no labels are ",
        "classified or excluded by this extractor."
      )
    ),
    compound_key_expression = "GSE318731|exact source filename|row.name",
    scope_boundaries = list(
      raw_source_extraction_only = TRUE,
      raw_labels_preserved = TRUE,
      classification_inference_applied = FALSE,
      label_normalization_applied = FALSE
    )
  )

  combined_name <- paste0(
    ACCESSION,
    "_multiome_metadata.combined.receipt.json"
  )
  write_deterministic_json(
    combined_receipt,
    file.path(staging_dir, combined_name)
  )

  list(
    combined_name = combined_name,
    total_nuclei = total_nuclei,
    total_groups = length(source_scoped_group_keys),
    observed_types = length(observed_types),
    matches_reported_type_total = matches_reported_type_total
  )
}

main <- function(arguments) {
  if (length(arguments) != 4L) {
    abort(
      paste0(
        "Usage: Rscript tools/extract_cano_gomez_multiome_metadata.R ",
        "<GSE318731_P56_cholinergic_multiome.rds> ",
        "<GSE318731_P56_gabaergic_multiome.rds> ",
        "<GSE318731_P56_glutamatergic_multiome_UPDATE.rds> ",
        "<new-output-directory>"
      )
    )
  }

  gzip_path <- require_runtime()
  locale_state <- set_deterministic_locale()
  on.exit(restore_locale(locale_state), add = TRUE)

  source_paths <- Map(
    validate_source_path,
    arguments[seq_len(3L)],
    SOURCE_SPECS
  )
  if (anyDuplicated(unlist(source_paths, use.names = FALSE)) > 0L) {
    abort("Each positional RDS input must resolve to a distinct file.")
  }

  output <- prepare_staging_directory(arguments[[4L]])
  committed <- FALSE
  on.exit({
    if (!committed && dir.exists(output$staging)) {
      unlink(output$staging, recursive = TRUE, force = TRUE)
    }
  }, add = TRUE)

  results <- vector("list", length(SOURCE_SPECS))
  for (index in seq_along(SOURCE_SPECS)) {
    results[[index]] <- extract_one_source(
      source_paths[[index]],
      SOURCE_SPECS[[index]],
      output$staging,
      gzip_path
    )
  }

  combined <- build_combined_receipt(results, output$staging)
  if (!file.rename(output$staging, output$final)) {
    abort(
      "Validated extraction completed, but staging could not be committed to: %s",
      output$final
    )
  }
  committed <- TRUE

  cat(sprintf(
    paste0(
      "Wrote validated raw metadata extraction to %s\n",
      "Asserted nuclei: %d; asserted groups: %d\n",
      "Observed raw neuron_types union: %d; reported 516 hard assertion: disabled\n",
      "Combined receipt: %s\n"
    ),
    output$final,
    combined$total_nuclei,
    combined$total_groups,
    combined$observed_types,
    combined$combined_name
  ))

  invisible(combined)
}

tryCatch(
  main(commandArgs(trailingOnly = TRUE)),
  error = function(error) {
    cat(
      sprintf("Cano-Gomez metadata extraction failed: %s\n", conditionMessage(error)),
      file = stderr()
    )
    quit(save = "no", status = 1L, runLast = FALSE)
  }
)
