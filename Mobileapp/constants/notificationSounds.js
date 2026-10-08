export const NOTIFICATION_SOUND_FILES = {
  coreflow_1: "coreflow_1.wav",
  kalimba_1: "kalimba_1.wav",
  kalimba_2: "kalimba_2.wav",
  kalimba_3: "kalimba_3.wav",
  kalimba_4: "kalimba_4.wav",
  nile_miles_1: "nile_miles_1.wav",
  nile_miles_2: "nile_miles_2.wav",
  nile_miles_3: "nile_miles_3.wav",
  nile_miles_4: "nile_miles_4.wav",
  sonic_logo_1: "sonic_logo_1.wav",
  sonic_logo_2: "sonic_logo_2.wav",
};

export const NOTIFICATION_SOUND_ASSETS = {
  coreflow_1: require("../assets/notificationSounds/coreflow_1.wav"),
  kalimba_1: require("../assets/notificationSounds/kalimba_1.wav"),
  kalimba_2: require("../assets/notificationSounds/kalimba_2.wav"),
  kalimba_3: require("../assets/notificationSounds/kalimba_3.wav"),
  kalimba_4: require("../assets/notificationSounds/kalimba_4.wav"),
  nile_miles_1: require("../assets/notificationSounds/nile_miles_1.wav"),
  nile_miles_2: require("../assets/notificationSounds/nile_miles_2.wav"),
  nile_miles_3: require("../assets/notificationSounds/nile_miles_3.wav"),
  nile_miles_4: require("../assets/notificationSounds/nile_miles_4.wav"),
  sonic_logo_1: require("../assets/notificationSounds/sonic_logo_1.wav"),
  sonic_logo_2: require("../assets/notificationSounds/sonic_logo_2.wav"),
};

export const NOTIFICATION_SOUND_GROUPS = {
  order: [
    { id: "coreflow_1", label: "CoreFlow" },
    { id: "silent", label: "Silent" },
  ],
  promotion: [
    { id: "kalimba_1", label: "Kalimba 1" },
    { id: "kalimba_2", label: "Kalimba 2" },
    { id: "kalimba_3", label: "Kalimba 3" },
    { id: "kalimba_4", label: "Kalimba 4" },
    { id: "silent", label: "Silent" },
  ],
  loyalty: [
    { id: "nile_miles_1", label: "Nile Miles 1" },
    { id: "nile_miles_2", label: "Nile Miles 2" },
    { id: "nile_miles_3", label: "Nile Miles 3" },
    { id: "nile_miles_4", label: "Nile Miles 4" },
    { id: "silent", label: "Silent" },
  ],
  system: [
    { id: "sonic_logo_1", label: "Sonic logo 1" },
    { id: "sonic_logo_2", label: "Sonic logo 2" },
    { id: "silent", label: "Silent" },
  ],
};
