# Simple HTML SVG Editor

Javascript project for drawing and editing Svg polylines

### Built with  

* [jQuery](https://jquery.com/)
* [Bootstrap](https://getbootstrap.com/)
* [D3.js](https://d3js.org/)

## Getting started

Clone or download the repository and run the files locally through a local web server (e.g. [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) for VS code)

## Usage

![screen](https://user-images.githubusercontent.com/64001284/107651753-29554580-6c80-11eb-8919-322b60593b97.png)

Start drawing a polyline by clicking on the canvas.

Finish the polyline by:
* _click on the last point_ / or press _Esc key_ -> as opened polyline
* _click on the first point_ / or press _Enter key_ -> as closed polyline

Select active polyline:
* _click on the inactive polyline_ -> in edit or move mode

Deselect active polyline:
* _Esc key_ -> when not drawing

### Navigation panel buttons:
* _Draw_ -> mode to draw polylines on canvas
* _Edit_ -> mode to edit active polyline shape - drag by control points
* _Move_ -> mode to drag whole polyline within the canvas

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
