import { configure } from '@testing-library/react-native';

// Con las pruebas corriendo en paralelo (el cifrado usa mucho CPU), 1 segundo de espera por
// defecto no alcanza a veces para que una pantalla termine de cargar.
configure({ asyncUtilTimeout: 5000 });
