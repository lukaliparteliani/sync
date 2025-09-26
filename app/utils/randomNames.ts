const alliance = ["DeathKnight", "Druid", "Hunter", "Mage", "Paladin"];

const horde = ["Priest", "Rogue", "Shaman", "Warlock", "Warrior"];

export function generateRandomUsername(): string {
  const adjective = alliance[Math.floor(Math.random() * alliance.length)];
  const noun = horde[Math.floor(Math.random() * horde.length)];
  const number = Math.floor(Math.random() * 100);
  return `${adjective}${noun}${number}`;
}

export function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
