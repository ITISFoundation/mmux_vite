# MMUX Flask API

This API constitutes the Python backend for the MMUX apps.

It performs three fundamental functions:
- Relays queries from the frontend to the osparc webserver.
- Applies the Dakota package to perform various metamodeling algorithms.
- Performs IO operations to save / recover application status (implementing persistence across sessions).

Flow is as follows:
- Data is queried by the frontend through the FlaskAPI backend to the osparc webserver, and returned to the frontend through the FlaskAPI backend - which is just acting as a relay.
- Data is shown to the user for manual selection and definition of user inputs (function selection, variable selection, input ranges, sample selection, etc)
- Selected data is passed by the frontend to the FlaskAPI backend for Dakota computation. Results are returned to the frontend for user visualization.
