///|
test "Box2 bounds and Line3 closest points" {
  let box = @three.Box2().set_from_points([
    @three.Vector2(-1, 2),
    @three.Vector2(3, 6),
  ])
  assert_true(box.get_center(@three.Vector2(0, 0)).equals(@three.Vector2(1, 4)))
  assert_true(box.clone().expand_by_scalar(1).contains_box(box))
  assert_eq(box.distance_to_point(@three.Vector2(6, 6)), 3)
  assert_true(box.make_empty().is_empty())
  let line = @three.Line3(@three.Vector3(0, 0, 0), @three.Vector3(4, 0, 0))
  near(
    line.closest_point_to_point_parameter(@three.Vector3(6, 2, 0), false),
    1.5,
  )
  let target = @three.Vector3(0, 0, 0)
  assert_true(
    line
    .closest_point_to_point(@three.Vector3(6, 2, 0), true, target)
    .equals(@three.Vector3(4, 0, 0)),
  )
  near(line.distance_squared(), 16)
}

///|
test "Triangle barycentric interpolation returns None for degeneracy" {
  let triangle = @three.Triangle(
    @three.Vector3(0, 0, 0),
    @three.Vector3(2, 0, 0),
    @three.Vector3(0, 2, 0),
  )
  near(triangle.get_area(), 2)
  let point = @three.Vector3(0.5, 0.5, 0)
  let target = @three.Vector3(0, 0, 0)
  assert_true(
    triangle
    .get_barycoord(point, target)
    .unwrap()
    .equals(@three.Vector3(0.5, 0.25, 0.25)),
  )
  let uv = triangle
    .get_interpolation2(
      point,
      @three.Vector2(0, 0),
      @three.Vector2(1, 0),
      @three.Vector2(0, 1),
      @three.Vector2(0, 0),
    )
    .unwrap()
  near(uv.x(), 0.25)
  near(uv.y(), 0.25)
  assert_true(triangle.contains_point(point))
  triangle.set(triangle.a(), triangle.a(), triangle.a()) |> ignore
  assert_true(triangle.get_barycoord(point, target) is None)
}

///|
test "Coordinate conversion and spherical harmonics preserve coefficients" {
  let c = @three.Cylindrical(2, 0, 3)
  let vector = @three.Vector3(0, 0, 0).set_from_cylindrical(c)
  assert_true(vector.equals(@three.Vector3(0, 3, 2)))
  near(c.clone().set_from_vector3(vector).radius(), 2)
  let sh = @three.SphericalHarmonics3()
  let coefficients = sh.coefficients()
  coefficients[0].set(1, 2, 3) |> ignore
  let result = sh.get_at(@three.Vector3(0, 0, 1), @three.Vector3(0, 0, 0))
  near(result.x(), 0.282095)
  let values = sh.to_array()
  assert_eq(values.length(), 27)
  assert_true(@three.SphericalHarmonics3().from_array(values, 0).equals(sh))
  coefficients[0] = @three.Vector3(9, 9, 9)
  near(sh.coefficients()[0].x(), 1)
}

///|
test "Vector and matrix array offsets, projection and component access" {
  let vector = @three.Vector3(0, 0, 0).from_array([99, 2, 3, 4, 99], 1)
  near(vector.get_component(1), 3)
  assert_true(
    vector
    .project_on_plane(@three.Vector3(0, 1, 0))
    .equals(@three.Vector3(2, 0, 4)),
  )
  let values : FixedArray[Double] = [99, 0, 0, 0, 99]
  vector.to_array_into(values, 1) |> ignore
  near(values[0], 99)
  near(values[3], 4)
  near(values[4], 99)
  let matrix = @three.Matrix3().make_translation(2, 3)
  assert_true(
    @three.Vector2(1, 1).apply_matrix3(matrix).equals(@three.Vector2(3, 4)),
  )
  assert_true(@three.Matrix3().from_array(matrix.to_array(), 0).equals(matrix))
  let small = @three.Matrix2().set(1, 2, 3, 4)
  assert_eq(small.elements()[1], 3)
  near(@three.Vector4(1, 2, 3, 4).divide_scalar(2).manhattan_length(), 5)
}

///|
test "Ray misses and coplanar intersections have typed nullable results" {
  let ray = @three.Ray(@three.Vector3(0, 0, 0), @three.Vector3(1, 0, 0))
  let plane = @three.Plane(@three.Vector3(0, 1, 0), -1)
  assert_true(ray.distance_to_plane(plane) is None)
  plane.set_constant(0)
  near(ray.distance_to_plane(plane).unwrap(), 0)
  let line = @three.Line3(@three.Vector3(0, -1, 0), @three.Vector3(0, 1, 0))
  assert_true(
    plane
    .intersect_line(line, @three.Vector3(0, 0, 0), true)
    .unwrap()
    .equals(@three.Vector3(0, 0, 0)),
  )
  let sphere = @three.Sphere(@three.Vector3(0, 0, 0), 1)
  assert_true(
    sphere
    .get_bounding_box(@three.Box3())
    .contains_point(@three.Vector3(1, 0, 0)),
  )
  assert_true(sphere.clone().make_empty().is_empty())
}

///|
test "Scene lookup, ancestors, recursive clone and detached parent" {
  let root = @three.Object3D()
  let child = @three.Object3D()
  child.set_name("child")
  root.add(child) |> ignore
  assert_true(root.get_object_by_id(child.id()).unwrap().same_reference(child))
  assert_true(root.get_object_by_name("missing") is None)
  let mut count = 0
  child.traverse_ancestors(fn(_) { count += 1 })
  assert_eq(count, 1)
  assert_eq(root.clone(recursive=false).children().length(), 0)
  assert_eq(root.clone(recursive=true).children().length(), 1)
  assert_true(child.parent().unwrap().same_reference(root))
  child.remove_from_parent() |> ignore
  assert_true(child.parent() is None)
}

///|
test "View offsets, camera arrays, stereo and LOD select real objects" {
  let perspective = @three.PerspectiveCamera(90, 2, 0.1, 100)
  let size = perspective.get_view_size(2, @three.Vector2(0, 0))
  near(size.x(), 8)
  near(size.y(), 4)
  perspective.set_view_offset(800, 400, 400, 0, 400, 400)
  assert_true(perspective.view().unwrap().enabled())
  assert_eq(perspective.view().unwrap().offset_x(), 400)
  perspective.clear_view_offset()
  assert_false(perspective.view().unwrap().enabled())
  let array = @three.ArrayCamera([perspective])
  assert_eq(array.cameras().length(), 1)
  let stereo = @three.StereoCamera()
  stereo.update(perspective)
  assert_true(
    stereo.camera_l().as_object3d().position().equals(@three.Vector3(0, 0, 0)),
  )
  let lod = @three.LOD()
  let high = @three.Object3D()
  let low = @three.Object3D()
  assert_true(lod.get_object_for_distance(0) is None)
  lod.add_level(high, 0, 0).add_level(low, 10, 0) |> ignore
  assert_true(lod.get_object_for_distance(12).unwrap().same_reference(low))
  perspective.as_object3d().position().set(0, 0, 20) |> ignore
  perspective.as_object3d().update_matrix_world(true)
  lod.update(perspective.as_camera())
  assert_eq(lod.get_current_level(), 1)
  assert_false(high.visible())
  assert_true(low.visible())
  assert_true(lod.remove_level(10))
  assert_eq(lod.levels().length(), 1)
}

///|
test "Animation action scheduling, warp and mixer cache" {
  let root = @three.Object3D()
  let track = @three.NumberKeyframeTrack(".position[x]", [0, 2], [0, 10]).as_keyframe_track()
  track.set_interpolation(@three.InterpolationMode::Linear) |> ignore
  assert_eq(track.get_value_size(), 1)
  let clip = @three.AnimationClip("move", 2, [track])
  let mixer = @three.AnimationMixer(root)
  assert_true(mixer.existing_action(clip) is None)
  let action = mixer.clip_action(clip)
  assert_eq(action.get_clip().name(), "move")
  assert_true(action.get_root().same_reference(root))
  action.set_duration(4).start_at(1).play() |> ignore
  near(action.time_scale(), 0.5)
  assert_true(action.is_scheduled())
  assert_false(action.is_running())
  mixer.update(2) |> ignore
  near(root.position().x(), 2.5)
  action.warp(0.5, 1, 1) |> ignore
  mixer.update(1) |> ignore
  near(action.get_effective_time_scale(), 1)
  action.stop_warping().stop_fading().stop() |> ignore
  mixer.uncache_action(clip)
  assert_true(mixer.existing_action(clip) is None)
}

///|
test "Boolean and string tracks preserve their value types" {
  let visibility = @three.BooleanKeyframeTrack(".visible", [0, 1], [true, false])
  let labels = @three.StringKeyframeTrack(".name", [0, 1], ["before", "after"])
  let root = @three.Object3D()
  let mixer = @three.AnimationMixer(root)
  let clip = @three.AnimationClip("state", 2, [
    visibility.as_keyframe_track(),
    labels.as_keyframe_track(),
  ])
  mixer.clip_action(clip).play() |> ignore
  mixer.update(1.5) |> ignore
  assert_false(root.visible())
  assert_eq(root.name(), "after")
  assert_eq(labels.values()[1], "after")
  assert_false(visibility.values()[1])
}

///|
test "Additional material maps, light power and polyhedra" {
  let texture = @three.Texture()
  let material = @three.MeshPhongMaterial(0xffffff, 32)
  assert_true(material.normal_map() is None)
  material.set_normal_map(Some(texture))
  material.set_normal_map_type(ObjectSpace)
  material.set_displacement_scale(2)
  material.set_env_map_intensity(0.5)
  assert_true(material.normal_map().unwrap().same_reference(texture))
  near(material.displacement_scale(), 2)
  let base = material.as_material()
  base.set_shadow_side(Some(@three.Side::BackSide))
  base.set_force_single_pass(true)
  let copy = base.clone()
  assert_eq(copy.shadow_side().unwrap(), @three.Side::BackSide)
  assert_true(copy.force_single_pass())
  base.set_shadow_side(None)
  assert_true(base.shadow_side() is None)
  material.set_normal_map(None)
  assert_true(material.normal_map() is None)
  let light = @three.PointLight(0xffffff, 1, 0, 2)
  light.set_power(4 * 3.141592653589793)
  near(light.as_light().intensity(), 1)
  let geometry = @three.TetrahedronGeometry(1, 0).as_buffer_geometry()
  assert_eq(geometry.get_attribute("position").unwrap().count(), 12)
  geometry.dispose()
  let line = @three.LineDashedMaterial(0xffffff, 1, 2, 1)
  near(line.dash_size(), 2)
  line.as_material().dispose()
  texture.dispose()
  base.dispose()
  copy.dispose()
}

///|
test "Static math, triangulation and animation utilities use module exports" {
  near(@three.MathUtils::clamp(5, 0, 2), 2)
  near(@three.MathUtils::euclidean_modulo(-1, 5), 4)
  near(@three.MathUtils::deg_to_rad(180), 3.141592653589793)
  assert_eq(@three.MathUtils::rand_int(3, 3), 3)
  assert_eq(
    @three.MathUtils::seeded_random(123),
    @three.MathUtils::seeded_random(123),
  )
  near(
    @three.DataUtils::from_half_float(@three.DataUtils::to_half_float(0.5)),
    0.5,
  )
  let contour : FixedArray[@three.Vector2] = [
    @three.Vector2(0, 0),
    @three.Vector2(2, 0),
    @three.Vector2(2, 2),
    @three.Vector2(0, 2),
  ]
  near(@three.ShapeUtils::area(contour), 4)
  assert_eq(@three.ShapeUtils::triangulate_shape(contour, []).length(), 2)
  let track = @three.NumberKeyframeTrack(".position[x]", [0, 1, 2, 3], [
    0, 10, 20, 30,
  ]).as_keyframe_track()
  let original = @three.AnimationClip("original", 3, [track])
  let clip = @three.AnimationUtils::subclip(original, "part", 1, 3, 1)
  near(clip.duration(), 1)
  assert_eq(clip.name(), "part")
  near(original.duration(), 3)
}

///|
test "Euler reordering preserves orientation and HSL conversion preserves channels" {
  let euler = @three.Euler(0.2, 0.3, 0.4)
  let expected = @three.Quaternion().set_from_euler(euler)
  euler.reorder(ZYX) |> ignore
  assert_eq(euler.order(), @three.EulerOrder::ZYX)
  assert_true(
    @three.Quaternion().set_from_euler(euler).angle_to(expected) < 0.0000001,
  )
  euler.set_from_vector3(@three.Vector3(1, 2, 3), order=YXZ) |> ignore
  assert_eq(euler.order(), @three.EulerOrder::YXZ)
  near(euler.x(), 1)
  let color = @three.Color::from_rgb(0, 0, 0).set_hsl(0.25, 0.5, 0.5)
  let hsl = color.get_hsl(@three.ColorHSL(0, 0, 0))
  near(hsl.h(), 0.25)
  near(hsl.s(), 0.5)
  near(hsl.l(), 0.5)
  assert_true(color.get_rgb(@three.Color::from_rgb(0, 0, 0)).equals(color))
  let point = @three.Vector3(0, 0, 0)
  assert_true(
    @three.Triangle::barycoord_from_points(
      point,
      point,
      point,
      point,
      @three.Vector3(0, 0, 0),
    )
    is None,
  )
}
