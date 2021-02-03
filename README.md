# Simple HTML SVG Editor

Javascript project for drawing and editing Svg polylines

### Built with  

* [jQuery](https://jquery.com/)
* [Bootstrap](https://getbootstrap.com/)
* [D3.js](https://d3js.org/)

## Getting started

Clone or download the repository and run the files locally through a local web server (e.g. [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) for VS code)

## Usage

![polyline](https://user-images.githubusercontent.com/64001284/106741109-90894f00-661b-11eb-95e1-d2aec52124a0.png)

Start drawing a polyline by clicking on the canvas.

Finish the polyline by:
* click on the last point / or press Esc key -> as opened polyline
* click on the first point / or press Enter key -> as closed polyline

Edit polyline shape by dragging polyline control points

### Navigation panel buttons:

* _Show grid_ -> toggle the grid visibility on and off
* _Snap_ -> toggle snapping to the grid on and off
* _Resolution_ -> set the grid resolution in pixels

* _Undo / Ctrl+Z_ -> Step backward
* _Redo / CTRL+Y_ -> Step forward

* _Delete path_ -> delete active polyline
* _Clear canvas_ -> delete all polylines

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)
