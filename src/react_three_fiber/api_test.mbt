///|
extern "js" fn frame_mode(props : @react_three_fiber.CanvasProps) -> String =
  #| props => props.frameloop

///|
extern "js" fn node_type(node : @react_three_fiber.Node) -> String =
  #| node => node.type

///|
extern "js" fn node_position_x(node : @react_three_fiber.Node) -> Double =
  #| node => node.props.position[0]

///|
extern "js" fn node_arg(node : @react_three_fiber.Node, index : Int) -> Double =
  #| (node, index) => node.props.args[index]

///|
test "cascade props and typed args produce native React elements" {
  let props = @react_three_fiber.CanvasProps()..set_frameloop(Demand)
  assert_eq(frame_mode(props), "demand")
  props.set_frameloop(Never)
  assert_eq(frame_mode(props), "never")
  props.set_frameloop(Always)
  assert_eq(frame_mode(props), "always")
  let node = @react_three_fiber.mesh(
    @react_three_fiber.Props()..set_position_xyz(2, 3, 4),
    [],
  )
  assert_eq(node_type(node), "mesh")
  assert_eq(node_position_x(node), 2)
  let geometry = @react_three_fiber.box_geometry(
    @react_three_fiber.Props()..set_args([
      @react_three_fiber.Arg::number(1.5),
      @react_three_fiber.Arg::int(2),
    ]),
  )
  assert_eq(node_type(geometry), "boxGeometry")
  assert_eq(node_arg(geometry, 0), 1.5)
  assert_eq(node_arg(geometry, 1), 2)
}
