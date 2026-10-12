"""LE COMPTOIR — rendu studio automatique.
Détoure la photo produit, la pose sur un fond sable dégradé avec une ombre douce,
et refuse les cas douteux (photo d'ambiance, détourage raté) plutôt que de livrer un mauvais visuel.
Usage : python studio.py entree.jpg sortie.jpg  -> code 0 = OK, 2 = refusé
"""
import sys, io
from PIL import Image, ImageFilter, ImageDraw, ImageOps
from rembg import remove, new_session

SIZE = 1600
TOP, BOTTOM = (243, 237, 227), (229, 220, 205)   # sable clair -> sable
_session = None

def session():
    global _session
    if _session is None:
        _session = new_session('isnet-general-use')
    return _session

def backdrop():
    bg = Image.new('RGB', (SIZE, SIZE), TOP)
    d = ImageDraw.Draw(bg)
    for y in range(SIZE):
        t = (y / SIZE) ** 1.4
        d.line([(0, y), (SIZE, y)], fill=tuple(int(TOP[i] + (BOTTOM[i] - TOP[i]) * t) for i in range(3)))
    # sol : léger assombrissement en bas, lumière venant de la gauche
    glow = Image.new('L', (SIZE, SIZE), 0)
    gd = ImageDraw.Draw(glow)
    gd.ellipse([-SIZE * .3, -SIZE * .4, SIZE * .9, SIZE * .7], fill=60)
    glow = glow.filter(ImageFilter.GaussianBlur(220))
    light = Image.new('RGB', (SIZE, SIZE), (250, 246, 239))
    return Image.composite(light, bg, glow)

def studio(src_bytes):
    im = Image.open(io.BytesIO(src_bytes)); im = ImageOps.exif_transpose(im).convert('RGB')
    if min(im.size) < 300:
        return None, 'image trop petite'
    cut = remove(im, session=session(), post_process_mask=True)
    a = cut.getchannel('A')
    bbox = a.point(lambda v: 255 if v > 24 else 0).getbbox()
    if not bbox:
        return None, 'rien détecté'
    cov = sum(1 for v in a.resize((100, 100)).get_flattened_data() if v > 128) / 10000
    bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    # photo d'ambiance ou détourage incertain : l'objet touche 3 bords ou couvre presque tout
    edges = sum([bbox[0] <= 2, bbox[1] <= 2, bbox[2] >= im.width - 2, bbox[3] >= im.height - 2])
    if cov > .70 or cov < .05 or edges >= 2:
        return None, f'refusé (couverture {cov:.2f}, bords {edges})'
    # contrôle qualité : un seul objet net, pas de morceaux éparpillés (infographies, montages)
    import numpy as np
    from scipy import ndimage
    m = np.array(a.resize((256, 256))) > 128
    lab, nb = ndimage.label(m)
    if nb == 0:
        return None, 'rien détecté'
    sizes = np.bincount(lab.ravel())[1:]
    tot = sizes.sum(); big = sizes.max()
    sig = int((sizes > tot * 0.02).sum())
    if big / tot < 0.88 or sig > 2:
        return None, f'refusé (fragments {big/tot:.2f}, {sig} morceaux)'
    # trous : un objet plein, pas une découpe en dentelle
    filled = ndimage.binary_fill_holes(lab == (sizes.argmax() + 1)).sum()
    if big / filled < 0.80:
        return None, f'refusé (découpe trouée {big/filled:.2f})'
    solid = big / float(((lab == (sizes.argmax() + 1)).any(0).sum()) * ((lab == (sizes.argmax() + 1)).any(1).sum()) or 1)
    if solid < 0.22:
        return None, f'refusé (forme trop mince {solid:.2f})'
    if (bw * bh) / float(im.width * im.height) < 0.06:
        return None, 'refusé (objet trop petit dans la photo)'
    obj = cut.crop(bbox)
    scale = min(SIZE * .74 / bw, SIZE * .72 / bh)
    obj = obj.resize((max(1, int(bw * scale)), max(1, int(bh * scale))), Image.LANCZOS)
    ow, oh = obj.size
    x = (SIZE - ow) // 2
    floor = int(SIZE * .86)
    y = floor - oh
    bg = backdrop()
    # ombre portée douce + ombre de contact
    sh = Image.new('L', (SIZE, SIZE), 0)
    sh.paste(obj.getchannel('A').point(lambda v: int(v * .30)), (x + int(ow * .02), y + int(oh * .025)))
    sh = sh.filter(ImageFilter.GaussianBlur(28))
    contact = Image.new('L', (SIZE, SIZE), 0)
    ImageDraw.Draw(contact).ellipse([x + ow * .08, floor - oh * .03 - 10, x + ow * .92, floor + oh * .035 + 10], fill=110)
    contact = contact.filter(ImageFilter.GaussianBlur(26))
    shadow = Image.composite(Image.new('L', (SIZE, SIZE), 255), sh, contact)
    dark = Image.new('RGB', (SIZE, SIZE), (92, 78, 62))
    bg = Image.composite(dark, bg, shadow.point(lambda v: int(v * .55)))
    bg.paste(obj, (x, y), obj)
    out = io.BytesIO(); bg.save(out, 'JPEG', quality=86, optimize=True, progressive=True)
    return out.getvalue(), 'ok'

if __name__ == '__main__':
    data, msg = studio(open(sys.argv[1], 'rb').read())
    if data is None:
        print(msg); sys.exit(2)
    open(sys.argv[2], 'wb').write(data); print(msg)
