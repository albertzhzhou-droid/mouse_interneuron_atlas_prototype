"""Only the parent-declared new information Link44px/12px delta is admissible."""
import hashlib,re
UI_PATH='app/ResearchSourceRegistry.tsx'
BEFORE={'bytes':23841,'sha256':'c423792176942a66d70c480a19d083ade86a4e51970be9bec018474e88068cd0'}
NEEDLE=b'<Link href={information.link.href} prefetch={false}>'
def byte_pin(body):return {'bytes':len(body),'sha256':hashlib.sha256(body).hexdigest()}
def assert_ui_delta(before,after):
    assert byte_pin(before)==BEFORE,'Original candidate UI before-body pin required'
    assert before.count(NEEDLE)==1,'Original new information Link must be unique'
    left,right=before.split(NEEDLE)
    assert after.startswith(left) and after.endswith(right),'Non-Link UI bytes changed'
    replacement=after[len(left):len(after)-len(right)] if right else after[len(left):]
    prefix=NEEDLE[:-1]
    assert replacement.startswith(prefix) and replacement.endswith(b'>'),'New Link JSX qualification changed'
    style=replacement[len(prefix):-1]
    assert re.fullmatch(rb' style=\{\{\s*minHeight:\s*44,\s*fontSize:\s*12\s*\}\}',style),'Only exact new Link minHeight44/fontSize12 style is allowed'
    assert after==before.replace(NEEDLE,replacement,1),'Additional UI changes refused'
    return {'path':UI_PATH,'before':byte_pin(before),'after':byte_pin(after),'exactAddedStyleLiteral':style.decode(),'oldLinkCount':1,'allowedDeltaOnly':'New source-information Link inline minHeight44/fontSize12; all other bytes identical.'}
