///|
fn matte(color : Int, metalness? : Double = 0) -> @three.MeshStandardMaterial {
  @three.MeshStandardMaterial(
    color,
    roughness=0.85,
    metalness~,
    flat_shading=true,
  )
}

///|
/// A sitting cat assembled entirely as Luna nodes. Angles are radians and eye
/// openness is 0..1. Shared flat-shaded resources live for the component's scope.
pub fn view(
  head_tilt? : () -> Double = fn() { 0 },
  tail_angle? : () -> Double = fn() { 0 },
  eyes_open? : () -> Double = fn() { 1 },
  palette? : () -> Int = fn() { 0 },
) -> @lt.Node {
  @luna.component(fn() {
    let round = @three.IcosahedronGeometry(1, 1).as_buffer_geometry()
    let point = @three.IcosahedronGeometry(1, 0).as_buffer_geometry()
    let ear = ear_geometry()
    let inner_ear = inner_ear_geometry()
    let tail = tail_geometry(false)
    let tail_tip = tail_geometry(true)
    let coat = matte(0xd49257)
    let markings = matte(0xa36539)
    let cream = matte(0xffe6be).as_material()
    let pink = matte(0xe9a89c).as_material()
    let dark = matte(0x38352f).as_material()
    let iris = matte(0xa4c2a0).as_material()
    let white = matte(0xfffaf0).as_material()
    let teal = matte(0x487f7b).as_material()
    let gold = matte(0xe9b956, metalness=0.4).as_material()
    @reactivity.on_cleanup(fn() {
      for geometry in [round, point, ear, inner_ear, tail, tail_tip] {
        geometry.dispose()
      }
      for
        material in [
          coat.as_material(),
          markings.as_material(),
          cream,
          pink,
          dark,
          iris,
          white,
          teal,
          gold,
        ] {
        material.dispose()
      }
    })
    @reactivity.render_effect(fn() {
      let (base, stripe) = match palette() {
        1 => (0x687682, 0x414c58)
        2 => (0xe9d5b1, 0xb9a280)
        _ => (0xd49257, 0xa36539)
      }
      coat.color().set_hex(base) |> ignore
      markings.color().set_hex(stripe) |> ignore
    })
    |> ignore
    let fur = coat.as_material()
    let stripe = markings.as_material()
    let body : Array[@lt.Node] = [
      part("cat-body", round, fur, at=(0, 0.89, -0.11), size=(0.60, 0.81, 0.49)),
      part(
        "haunch-left",
        round,
        fur,
        at=(-0.43, 0.46, -0.08),
        size=(0.37, 0.43, 0.43),
      ),
      part(
        "haunch-right",
        round,
        fur,
        at=(0.43, 0.46, -0.08),
        size=(0.37, 0.43, 0.43),
      ),
      part("chest", round, cream, at=(0, 1.02, 0.305), size=(0.34, 0.48, 0.18)),
      part(
        "paw-back-left",
        round,
        cream,
        at=(-0.51, 0.18, 0.16),
        size=(0.24, 0.17, 0.30),
      ),
      part(
        "paw-back-right",
        round,
        cream,
        at=(0.51, 0.18, 0.16),
        size=(0.24, 0.17, 0.30),
      ),
      @lt.mesh(
        geometry=Cylinder(0.135, 0.115, 0.68, 6),
        material=Borrowed(fur),
        props=[
          @lt.prop(Name("leg-front-left")),
          @lt.prop(Position(-0.23, 0.58, 0.37)),
          @lt.prop(CastShadow(true)),
        ],
      ),
      @lt.mesh(
        geometry=Cylinder(0.135, 0.115, 0.68, 6),
        material=Borrowed(fur),
        props=[
          @lt.prop(Name("leg-front-right")),
          @lt.prop(Position(0.23, 0.58, 0.37)),
          @lt.prop(CastShadow(true)),
        ],
      ),
      part(
        "paw-front-left",
        round,
        cream,
        at=(-0.23, 0.18, 0.47),
        size=(0.18, 0.17, 0.27),
      ),
      part(
        "paw-front-right",
        round,
        cream,
        at=(0.23, 0.18, 0.47),
        size=(0.18, 0.17, 0.27),
      ),
      @lt.mesh(geometry=Torus(0.365, 0.038, 4, 12), material=Borrowed(teal), props=[
        @lt.prop(Name("collar")),
        @lt.prop(Position(0, 1.38, 0.12)),
        @lt.prop(Rotation(1.5707963267948966, 0, 0)),
      ]),
      part("bell", point, gold, at=(0, 1.30, 0.50), size=(0.075, 0.082, 0.075)),
      @lt.group(
        [
          part("tail-fur", tail, fur, at=(0, 0, 0), size=(1, 1, 1)),
          part("tail-cream", tail_tip, cream, at=(0, 0, 0), size=(1, 1, 1)),
          part(
            "tail-tip",
            round,
            cream,
            at=(1.05, 0.92, 0.14),
            size=(0.12, 0.12, 0.12),
          ),
        ],
        props=[
          @lt.prop(Name("cat-tail")),
          @lt.prop(Position(0, 0.44, -0.38)),
          @lt.dynamic(fn() { Rotation(0, tail_angle(), 0) }),
        ],
      ),
    ]
    let face : Array[@lt.Node] = [
      part("head-fur", round, fur, at=(0, 0, 0), size=(0.64, 0.52, 0.48)),
      part(
        "muzzle-left",
        round,
        cream,
        at=(-0.15, -0.20, 0.425),
        size=(0.215, 0.16, 0.16),
      ),
      part(
        "muzzle-right",
        round,
        cream,
        at=(0.15, -0.20, 0.425),
        size=(0.215, 0.16, 0.16),
      ),
      part("nose", point, pink, at=(0, -0.15, 0.59), size=(0.079, 0.055, 0.043)),
      whisker(
        "mouth-center",
        (0, -0.18),
        (0, -0.235),
        dark,
        z=0.593,
        radius=0.008,
      ),
      whisker(
        "mouth-left",
        (0, -0.235),
        (-0.08, -0.265),
        dark,
        z=0.583,
        radius=0.008,
      ),
      whisker(
        "mouth-right",
        (0, -0.235),
        (0.08, -0.265),
        dark,
        z=0.583,
        radius=0.008,
      ),
    ]
    for side in [-1.0, 1.0] {
      let suffix = if side < 0 { "left" } else { "right" }
      face.push(
        @lt.group(
          [
            part("ear-\{suffix}", ear, fur, at=(0, 0, 0), size=(1, 1, 1)),
            part(
              "inner-ear-\{suffix}",
              inner_ear,
              pink,
              at=(0, 0, 0),
              size=(1, 1, 1),
            ),
          ],
          props=[
            @lt.prop(Position(side * 0.39, 0.32, 0)),
            @lt.prop(Rotation(0, 0, -side * 0.16)),
          ],
        ),
      )
      face.push(
        @lt.group(
          [
            part(
              "eye-\{suffix}",
              round,
              iris,
              at=(0, 0, 0),
              size=(0.155, 0.185, 0.06),
            ),
            part(
              "pupil-\{suffix}",
              round,
              dark,
              at=(0, 0, 0.05),
              size=(0.042, 0.132, 0.02),
            ),
            part(
              "eye-glint-\{suffix}",
              point,
              white,
              at=(-0.043, 0.070, 0.067),
              size=(0.026, 0.028, 0.016),
            ),
          ],
          props=[
            @lt.prop(Name("eyelids-\{suffix}")),
            @lt.prop(Position(side * 0.275, 0.035, 0.405)),
            @lt.prop(Rotation(0, side * 0.30, 0)),
            @lt.dynamic(fn() { Scale(1, eyes_open().clamp(min=0.06, max=1), 1) }),
          ],
        ),
      )
      for index in 0..<3 {
        let angle = (index - 1).to_double()
        face.push(
          whisker(
            "whisker-\{suffix}-\{index}",
            (side * 0.22, -0.19 + angle * 0.025),
            (side * (0.73 - angle.abs() * 0.035), -0.19 + angle * 0.14),
            dark,
          ),
        )
      }
      face.push(
        part(
          "forehead-stripe-\{suffix}",
          point,
          stripe,
          at=(side * 0.14, 0.30, 0.382),
          size=(0.044, 0.125, 0.027),
          rotation=(-0.60, 0, -side * 0.22),
        ),
      )
    }
    face.push(
      part(
        "forehead-stripe-center",
        point,
        stripe,
        at=(0, 0.32, 0.39),
        size=(0.04, 0.15, 0.027),
        rotation=(-0.60, 0, 0),
      ),
    )
    body.push(
      @lt.group(face, props=[
        @lt.prop(Name("cat-head")),
        @lt.prop(Position(0, 1.77, 0.19)),
        @lt.dynamic(fn() { Rotation(0, 0, head_tilt()) }),
      ]),
    )
    @lt.group(body, props=[@lt.prop(Name("cat"))])
  })
}
