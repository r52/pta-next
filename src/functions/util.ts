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

export function getElapsedTime(t1: number, t2: number) {
  let dif = t1 - t2;

  // convert to seconds
  dif = Math.floor(dif / 1000);

  if (dif < 60) {
    return dif.toString() + ' seconds';
  }

  // minutes
  if (dif < 3600) {
    return Math.floor(dif / 60).toString() + ' minutes';
  }

  if (dif < 86400) {
    return Math.floor(dif / 3600).toString() + ' hours';
  }

  return Math.floor(dif / 86400).toString() + ' days';
}
