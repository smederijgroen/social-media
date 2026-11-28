# Vistamont: frameloze glasbalustrade langs een vide (L-vorm), reel 1080x1920.
# Gebruik in Blender: Scripting > Open > Run Script. Of: blender -b -P vistamont_vide.py -- --render
import bpy, math, sys
from mathutils import Vector

FPS = 30
SECONDS = 8
ENGINE = "BLENDER_EEVEE_NEXT"     # snel op de Mac; zet op "CYCLES" voor de mooiste versie
PROFIEL = "zijkant"                 # "zijkant" (vloer loopt door tot het glas) of "vloer"
PROFIEL_KLEUR = (0.02, 0.02, 0.022) # zwart; wit = (0.85, 0.85, 0.84)
GLAS_HOOGTE = 1.0
VLOER_DIK = 0.32
VIDE_X, VIDE_Y = 3.2, 2.6           # opening van de vide (m)

# ---------- schoon beginnen ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

def mat(name, color, rough=0.5, metal=0.0, **kw):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    for k, v in kw.items(): b.inputs[k].default_value = v
    return m

def box(name, loc, size, m):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.object; o.name = name
    o.scale = (size[0] / 2, size[1] / 2, size[2] / 2)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bev = o.modifiers.new("bevel", "BEVEL"); bev.width = 0.004; bev.segments = 2
    o.data.materials.append(m); return o

# ---------- materialen (CC0-texturen van Poly Haven, map tex/ naast dit script) ----------
import os
TEX = os.path.join(os.path.dirname(bpy.data.filepath) or os.path.dirname(os.path.abspath(__file__ if "__file__" in dir() else ".")), "tex")
if not os.path.isdir(TEX): TEX = "/home/claude/social-media/blender/tex"

def pbr(name, base, size, tint=(1, 1, 1)):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord"); mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1 / size, 1 / size, 1 / size)
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    def img(kind, colour):
        n = nt.nodes.new("ShaderNodeTexImage"); n.projection = "BOX"; n.projection_blend = 0.15
        n.image = bpy.data.images.load(os.path.join(TEX, f"{base}_{kind}_2k.jpg"))
        if not colour: n.image.colorspace_settings.name = "Non-Color"
        nt.links.new(mp.outputs[0], n.inputs["Vector"]); return n
    d = img("diff", True)
    hs = nt.nodes.new("ShaderNodeMix"); hs.data_type = "RGBA"; hs.blend_type = "MULTIPLY"; hs.inputs[0].default_value = 1
    hs.inputs[7].default_value = (*tint, 1)
    nt.links.new(d.outputs["Color"], hs.inputs[6]); nt.links.new(hs.outputs[2], b.inputs["Base Color"])
    nt.links.new(img("rough", False).outputs["Color"], b.inputs["Roughness"])
    nm = nt.nodes.new("ShaderNodeNormalMap"); nm.inputs["Strength"].default_value = 0.6
    nt.links.new(img("nor_gl", False).outputs["Color"], nm.inputs["Color"]); nt.links.new(nm.outputs[0], b.inputs["Normal"])
    return m

M_PARKET = pbr("Parket", "herringbone_parquet", 2.0)
M_STEEN = pbr("Baksteen", "red_brick_03", 1.6)
M_STUC = pbr("Stuc", "painted_plaster_wall", 2.0, (1.05, 1.03, 1.0))
M_BETON = mat("Beton", (0.55, 0.54, 0.52), 0.8)
M_PROF = mat("Profiel", PROFIEL_KLEUR, 0.35, 0.6)
M_GLAS = mat("Glas", (0.94, 0.98, 0.96), 0.0, **{"Transmission Weight": 1.0, "IOR": 1.5})
M_RAND = mat("Glasrand", (0.55, 0.75, 0.68), 0.05, **{"Transmission Weight": 0.6, "IOR": 1.5})
M_ZWART = mat("Kozijn", (0.03, 0.03, 0.03), 0.4, 0.5)

# ---------- ruimte ----------
W, D, H = 7.0, 6.0, 3.0            # verdieping: breedte, diepte, hoogte tot plafond
# bovenverdieping in vier stroken rond de vide (vide in hoek x>0,y>0 tegen de muren)
x0, y0 = W / 2 - VIDE_X, D / 2 - VIDE_Y
z = -VLOER_DIK / 2
box("Vloer A", ((-W / 2 + x0) / 2, 0, z), (x0 + W / 2, D, VLOER_DIK), M_PARKET)
box("Vloer B", ((x0 + W / 2) / 2, (-D / 2 + y0) / 2, z), (W / 2 - x0, y0 + D / 2, VLOER_DIK), M_PARKET)
box("Benedenvloer", (0, 0, -H - 0.05), (W, D, 0.1), M_BETON)
box("Muur achter", (0, D / 2 + 0.1, H / 2 - H / 2), (W + 0.4, 0.2, 2 * H + 0.4), M_STUC)
box("Muur rechts", (W / 2 + 0.1, 0, 0), (0.2, D, 2 * H + 0.4), M_STEEN)
box("Plafond", (0, 0, H + 0.1), (W, D, 0.2), M_STUC)
# hoog raam in de achterwand, licht valt de vide in
win = box("Raamopening", (x0 + 0.9, D / 2 + 0.1, 0.2), (1.4, 0.24, 4.6), M_ZWART)
bool_mod = bpy.data.objects["Muur achter"].modifiers.new("raam", "BOOLEAN"); bool_mod.object = win; bool_mod.operation = "DIFFERENCE"
win.hide_render = True; win.hide_viewport = True
for i, xx in enumerate([x0 + 0.2, x0 + 0.9, x0 + 1.6]):
    box(f"Kozijn {i}", (xx, D / 2 + 0.02, 0.2), (0.05, 0.06, 4.6), M_ZWART)

# ---------- balustrade: L-vorm langs de twee open randen ----------
T = 0.0175                          # gelaagd glas
def strook(name, a, b):
    """Glas + profiel van punt a naar b (op de vloerrand)."""
    a, b = Vector(a), Vector(b); d = b - a; L = d.length; mid = (a + b) / 2
    ang = math.atan2(d.y, d.x)
    if PROFIEL == "zijkant":
        pz, ph, pt, glas_z0 = -VLOER_DIK / 2, VLOER_DIK * 0.75, 0.06, -VLOER_DIK * 0.45
    else:
        pz, ph, pt, glas_z0 = 0.05, 0.10, 0.07, 0.03
    off = Vector((-math.sin(ang), math.cos(ang), 0)) * (pt / 2 if PROFIEL == "zijkant" else -pt / 2)
    p = box(name + " profiel", (mid.x - off.x, mid.y - off.y, pz), (L, pt, ph), M_PROF); p.rotation_euler.z = ang
    n = max(1, round(L / 1.25)); seg = L / n
    for i in range(n):
        c = a + d.normalized() * (seg * (i + 0.5))
        gc = c - off * (1 if PROFIEL == "zijkant" else 0)
        g = box(f"{name} glas {i}", (gc.x, gc.y, glas_z0 + (GLAS_HOOGTE - glas_z0) / 2), (seg - 0.004, T, GLAS_HOOGTE - glas_z0), M_GLAS)
        g.rotation_euler.z = ang
        g.data.materials.append(M_RAND)
        for poly in g.data.polygons:
            if abs(poly.normal.y) < 0.5: poly.material_index = 1
strook("Rand X", (x0, y0, 0), (W / 2, y0, 0))
strook("Rand Y", (x0, y0, 0), (x0, D / 2, 0))

# wat meubels als schaal (eenvoudige blokken), ook beneden in de vide
box("Bank beneden", (x0 + 1.3, y0 + 1.0, -H + 0.22), (1.8, 0.85, 0.44), mat("Stof2", (0.32, 0.36, 0.34), 0.9))
box("Kleed", (x0 + 1.2, y0 + 0.5, -H + 0.006), (2.0, 1.4, 0.01), mat("Kleed", (0.72, 0.68, 0.6), 1.0))
box("Bank", (-3.0, 0.6, 0.22), (0.9, 2.0, 0.44), mat("Stof", (0.55, 0.52, 0.47), 0.9))
box("Tafel", (-2.0, 0.6, 0.2), (0.6, 0.9, 0.04), mat("Eiken", (0.45, 0.30, 0.18), 0.5))

# ---------- licht ----------
world = bpy.data.worlds.new("Lucht"); sc.world = world; world.use_nodes = True
env = world.node_tree.nodes.new("ShaderNodeTexEnvironment")
env.image = bpy.data.images.load(os.path.join(TEX, "kloofendal_48d_partly_cloudy_puresky_2k.hdr"))
world.node_tree.links.new(env.outputs[0], world.node_tree.nodes["Background"].inputs[0])
world.node_tree.nodes["Background"].inputs[1].default_value = 1.2
bpy.ops.object.light_add(type="SUN", rotation=(math.radians(55), 0, math.radians(200)))
bpy.context.object.data.energy = 2.2; bpy.context.object.data.angle = math.radians(2)
bpy.ops.object.light_add(type="AREA", location=(x0 + 0.9, D / 2 - 0.3, 1.0), rotation=(math.radians(90), 0, 0))
a = bpy.context.object.data; a.energy = 260; a.size = 1.4; a.size_y = 4; a.shape = "RECTANGLE"; a.color = (1, 0.97, 0.92)
bpy.ops.object.light_add(type="AREA", location=(-1, -1, H - 0.05)); bpy.context.object.data.energy = 40; bpy.context.object.data.size = 4

# ---------- camera: rustige boog om de hoek van de balustrade ----------
corner = Vector((x0, y0, 0.5))
tgt = bpy.data.objects.new("Doel", None); sc.collection.objects.link(tgt); tgt.location = corner + Vector((1.1, 0.9, -1.8))
cam_d = bpy.data.cameras.new("Cam"); cam_d.lens = 24; cam_d.dof.use_dof = True
cam_d.dof.focus_object = tgt; cam_d.dof.aperture_fstop = 5.6
cam = bpy.data.objects.new("Cam", cam_d); sc.collection.objects.link(cam); sc.camera = cam
tr = cam.constraints.new("TRACK_TO"); tr.target = tgt; tr.track_axis = "TRACK_NEGATIVE_Z"; tr.up_axis = "UP_Y"
N = FPS * SECONDS; sc.frame_start, sc.frame_end = 1, N
for f, (ang, r, hz) in [(1, (215, 2.4, 2.05)), (N, (250, 2.0, 1.9))]:
    a_ = math.radians(ang)
    cam.location = corner + Vector((math.cos(a_) * r, math.sin(a_) * r, hz - corner.z))
    cam.keyframe_insert("location", frame=f)
tgt.keyframe_insert("location", frame=1); tgt.location = corner + Vector((1.3, 1.0, -1.6)); tgt.keyframe_insert("location", frame=N)
for o in (cam, tgt):
    if o.animation_data and o.animation_data.action:
        try:
            for fc in o.animation_data.action.fcurves:
                for k in fc.keyframe_points: k.interpolation = "BEZIER"; k.easing = "EASE_IN_OUT"
        except AttributeError: pass  # nieuwere Blender: standaard al vloeiend

# ---------- render ----------
sc.render.resolution_x, sc.render.resolution_y, sc.render.fps = 1080, 1920, FPS
sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Medium High Contrast"; sc.view_settings.exposure = -0.3
try: sc.render.engine = ENGINE
except TypeError: sc.render.engine = "BLENDER_EEVEE"
if sc.render.engine == "CYCLES":
    sc.cycles.samples = 128; sc.cycles.use_denoising = True
    try: bpy.context.preferences.addons["cycles"].preferences.compute_device_type = "METAL"; sc.cycles.device = "GPU"
    except Exception: pass
else:
    try: sc.eevee.use_raytracing = True; sc.eevee.taa_render_samples = 64
    except Exception: pass
try:
    try: sc.render.image_settings.media_type = "VIDEO"   # Blender 5
    except Exception: pass
    sc.render.image_settings.file_format = "FFMPEG"; sc.render.ffmpeg.format = "MPEG4"
    sc.render.ffmpeg.codec = "H264"; sc.render.ffmpeg.constant_rate_factor = "HIGH"
    sc.render.filepath = "//vistamont-vide-blender.mp4"
except Exception:
    sc.render.image_settings.file_format = "PNG"; sc.render.filepath = "//frames/vide_"
if "--render" in sys.argv: bpy.ops.render.render(animation=True)
