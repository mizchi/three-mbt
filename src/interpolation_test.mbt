///|
test "Linear and discrete interpolation clamp endpoints and return snapshots" {
  let linear = @three.LinearInterpolant([0, 1, 2], [0, 10, 10, 20, 20, 30], 2).as_interpolant()
  let first = linear.evaluate(0.25)
  near(first[0], 2.5)
  near(first[1], 12.5)
  near(linear.evaluate(1.5)[0], 15)
  near(first[0], 2.5)
  near(linear.evaluate(-10)[0], 0)
  near(linear.evaluate(10)[0], 20)
  near(linear.evaluate(0.5)[0], 5)
  assert_eq(linear.value_size(), 2)
  let times = linear.parameter_positions()
  times[0] = -100
  near(linear.parameter_positions()[0], 0)
  let discrete = @three.DiscreteInterpolant([0, 1, 2], [3, 6, 9], 1).as_interpolant()
  near(discrete.evaluate(0.99)[0], 3)
  near(discrete.evaluate(1)[0], 6)
}

///|
test "Cubic, quaternion and Bezier interpolants use typed configuration" {
  let cubic = @three.CubicInterpolant([0, 1, 2], [0, 10, 20], 1)
  cubic.set_endings(ZeroCurvature, ZeroCurvature)
  near(cubic.as_interpolant().evaluate(0.5)[0], 5)
  assert_eq(cubic.ending_start(), @three.InterpolationEnding::ZeroCurvature)
  let rotation = @three.QuaternionLinearInterpolant(
      [0, 1],
      [0, 0, 0, 1, 0, 0, 1, 0],
      4,
    )
    .as_interpolant()
    .evaluate(0.5)
  near(rotation[2], 0.7071067811865476)
  near(rotation[3], 0.7071067811865476)
  let bezier = @three.BezierInterpolant([0, 1], [0, 1], 1)
  near(bezier.as_interpolant().evaluate(0.5)[0], 0.5)
  bezier.set_tangents([0, 0, 0.6666666666666666, 0], [
    0.3333333333333333, 0, 1, 1,
  ])
  near(bezier.as_interpolant().evaluate(0.5)[0], 0.125)
  bezier.clear_tangents()
  near(bezier.as_interpolant().evaluate(0.5)[0], 0.5)
}

///|
test "Track interpolants reject nonnumeric values without unsafe casts" {
  let track = @three.NumberKeyframeTrack(".position[x]", [0, 2], [0, 10]).as_keyframe_track()
  near(track.create_numeric_interpolant().unwrap().evaluate(1)[0], 5)
  track.set_interpolation(Discrete) |> ignore
  near(track.create_numeric_interpolant().unwrap().evaluate(1)[0], 0)
  let strings = @three.StringKeyframeTrack(".name", [0, 1], ["a", "b"]).as_keyframe_track()
  assert_true(strings.create_numeric_interpolant() is None)
}
