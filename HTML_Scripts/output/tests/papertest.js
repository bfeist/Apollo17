// Create a circle shaped path with its center at the center
// of the view and a radius of 30:

var text = new PointText({
    point: view.center,
    justification: 'center',
    fontSize: 30,
    fillColor: 'grey',
    content: 'text'
});

var mouseFollowPath = new Path();
mouseFollowPath.strokeColor = 'black';

function onResize(event) {
    // Whenever the window is resized, recenter the path:
    text.point = view.center;
}

function onMouseMove(event) {
    mouseFollowPath.removeSegments();
    mouseFollowPath.add(event.point.x, 0);
    mouseFollowPath.add(event.point.x, view.size.height);
    text.content = event.point.x;
}