export function secondsDisplay(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(2)} seconds`;
  }
  const minutes = seconds / 60;
  if (minutes < 60) {
    return `${minutes.toFixed(2)} minutes`;
  }
  const hours = minutes / 60;
  return `${hours.toFixed(2)} hours`;
}

export function detailedTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(2)} scs`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  if (minutes < 60) {
    return `${minutes} mns ${remainingSeconds} scs`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} hrs ${remainingMinutes} mns ${remainingSeconds} scs`;
}
