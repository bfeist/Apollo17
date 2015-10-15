// Create a circle shaped path with its center at the center
// of the view and a radius of 30:

var text = new paper.PointText({
    point: paper.view.center,
    justification: 'center',
    fontSize: 12,
    fillColor: 'grey',
    content: 'Mission Timeline Interface Placeholder'
});

var mouseFollowPath = new paper.Path();
mouseFollowPath.strokeColor = 'lightgrey';

function onResize(event) {
    // Whenever the window is resized, recenter the path:
    text.point = paper.view.center;
}

function onMouseMove(event) {
    mouseFollowPath.removeSegments();
    mouseFollowPath.add(event.point.x, 0);
    mouseFollowPath.add(event.point.x, view.size.height);
    text.content = "Mission Timeline Interface Placeholder " + event.point.x;
}

//First define the zoom tool properties

var toolZoomIn = new paper.Tool();

toolZoomIn.distanceThreshold = 8;
toolZoomIn.mouseStartPos = new paper.Point();
toolZoomIn.zoomFactor = 2;

//Let's draw a reference rectangle to compare between grids.

//var rectangle = new paper.Rectangle(new paper.Point(50, 50), new paper.Point(150, 100));
//var path = new paper.Path.Rectangle(rectangle);
//path.fillColor = '#e9e9ff';
//path.selected = false;

var gridGroup = new paper.Group;
drawGrid();

//The function that draws horizontal/vertical lines

function drawGridOnScreen(){

//Width/Height per cell on the grid variables

    var widthPerCell = 20;
    var heightPerCell = 20;

//Draw the grid lines and add them into the global group above that holds all the lines

    var drawGridLines = function(num_rectangles_wide, num_rectangles_tall, boundingRect) {

        for (var i = 0; i <= num_rectangles_wide; i++) {
            var correctedBoundingRectLeft = Math.ceil(boundingRect.left/widthPerCell) * widthPerCell;
            var xPos = correctedBoundingRectLeft + i * widthPerCell;
            var topPoint = new paper.Point(xPos, boundingRect.top);
            var bottomPoint = new paper.Point(xPos, boundingRect.bottom);
            var aLine = new paper.Path.Line(topPoint, bottomPoint);
            aLine.strokeColor = 'grey';
            gridGroup.addChild(aLine);
        }

        for (i = 0; i <= num_rectangles_tall; i++) {
            var correctedBoundingRectTop = Math.ceil(boundingRect.top/heightPerCell) * heightPerCell;
            var yPos = correctedBoundingRectTop + i * heightPerCell;
            var leftPoint = new paper.Point(boundingRect.left, yPos);
            var rightPoint = new paper.Point(boundingRect.right, yPos);
            var bLine = new paper.Path.Line(leftPoint, rightPoint);
            bLine.strokeColor = 'grey';
            gridGroup.addChild(bLine);
        }
    }
//Find out how many cells we need vertically/horizontally first and then call the ''grid maker'' function to draw them.

    var numberOfVerticalCells = paper.view.bounds.width / widthPerCell;
    var numberOfHorizontalCells = paper.view.bounds.height / heightPerCell;

    drawGridLines(numberOfVerticalCells, numberOfHorizontalCells, paper.view.bounds);
}

//This function gets called on each mouse zoom interval. If there is a previously drawn grid, delete it and start over.

function drawGrid(){

    if (gridGroup.isEmpty()) {
        drawGridOnScreen();
    }

    else {
        gridGroup.removeChildren();
        drawGridOnScreen();
    }

}
