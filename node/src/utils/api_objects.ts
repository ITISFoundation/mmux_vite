// Dakota local server - also performs all calls to the osparc API
console.log("imported!", import.meta.env.VITE_PYTHON_DAKOTA_BACKEND);
export const PYTHON_DAKOTA_BACKEND = import.meta.env.VITE_PYTHON_DAKOTA_BACKEND || 'http://localhost:5000';
