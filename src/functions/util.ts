export function isNumber(evt: KeyboardEvent) {
  const key = evt.key;

  switch (key) {
    case '0':
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
    case '9':
    case '-':
    case '.':
      break;
    default:
      evt.preventDefault();
      break;
  }
}
