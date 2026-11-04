export function motionSettings(reduced: boolean, delay = 0) {
  return reduced
    ? { initial: false as const, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 16 },
        transition: { duration: 0.5, delay, ease: "easeOut" as const },
      };
}
