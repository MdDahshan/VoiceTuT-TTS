import { DEFAULT_PARAMS, type Params } from "./components/Settings";

export const DEFAULT_SCRIPT =
  "النهارده الجو حلو أوي في إسكندرية، يلا نطلع نتمشى شوية على الكورنيش ونشرب قهوة سوا.";

export const DEFAULT_SPEAKERS = [
  { speaker_id: "Mohammed", speaker_name: "Mohammed", arabic_name: "محمد", gender: "male", tags: ["طبيعي", "سرد"], reference_text: "", audio_url: "voices/Mohammed" },
  { speaker_id: "Ahmed", speaker_name: "Ahmed", arabic_name: "أحمد", gender: "male", tags: ["شبابي", "حماسي"], reference_text: "", audio_url: "voices/Ahmed" },
  { speaker_id: "Mariam", speaker_name: "Mariam", arabic_name: "مريم", gender: "female", tags: ["هادئ", "واضح"], reference_text: "", audio_url: "voices/Mariam" },
  { speaker_id: "Sarah", speaker_name: "Sarah", arabic_name: "سارة", gender: "female", tags: ["تعبيري", "قصصي"], reference_text: "", audio_url: "voices/Sarah" },
  { speaker_id: "Ali", speaker_name: "Ali", arabic_name: "علي", gender: "male", tags: ["إعلاني", "قوي"], reference_text: "", audio_url: "voices/Ali" },
  { speaker_id: "Hassan", speaker_name: "Hassan", arabic_name: "حسن", gender: "male", tags: ["وقور", "عميق"], reference_text: "", audio_url: "voices/Hassan" },
  { speaker_id: "Karim", speaker_name: "Karim", arabic_name: "كريم", gender: "male", tags: ["حوار", "ودود"], reference_text: "", audio_url: "voices/Karim" },
  { speaker_id: "Mahmoud", speaker_name: "Mahmoud", arabic_name: "محمود", gender: "male", tags: ["رسمي", "واضح"], reference_text: "", audio_url: "voices/Mahmoud" },
  { speaker_id: "Mostafa", speaker_name: "Mostafa", arabic_name: "مصطفى", gender: "male", tags: ["تفاعلي"], reference_text: "", audio_url: "voices/Mostafa" },
  { speaker_id: "Ramy", speaker_name: "Ramy", arabic_name: "رامي", gender: "male", tags: ["عفوي", "عامي"], reference_text: "", audio_url: "voices/Ramy" },
  { speaker_id: "Shaker", speaker_name: "Shaker", arabic_name: "شاكر", gender: "male", tags: ["إذاعي"], reference_text: "", audio_url: "voices/Shaker" },
  { speaker_id: "Tareq", speaker_name: "Tareq", arabic_name: "طارق", gender: "male", tags: ["شاب"], reference_text: "", audio_url: "voices/Tareq" },
  { speaker_id: "Yehia", speaker_name: "Yehia", arabic_name: "يحيى", gender: "male", tags: ["هادئ"], reference_text: "", audio_url: "voices/Yehia" },
  { speaker_id: "Youssef", speaker_name: "Youssef", arabic_name: "يوسف", gender: "male", tags: ["حماسي"], reference_text: "", audio_url: "voices/Youssef" },
  { speaker_id: "Hadeer", speaker_name: "Hadeer", arabic_name: "هدير", gender: "female", tags: ["عفوي", "بودكاست"], reference_text: "", audio_url: "voices/Hadeer" },
  { speaker_id: "Hanan", speaker_name: "Hanan", arabic_name: "حنان", gender: "female", tags: ["سردي", "دافئ"], reference_text: "", audio_url: "voices/Hanan" },
  { speaker_id: "Rana", speaker_name: "Rana", arabic_name: "رنا", gender: "female", tags: ["مرح", "إعلاني"], reference_text: "", audio_url: "voices/Rana" },
  { speaker_id: "Yasmin", speaker_name: "Yasmin", arabic_name: "ياسمين", gender: "female", tags: ["ناعم", "احترافي"], reference_text: "", audio_url: "voices/Yasmin" },
  { speaker_id: "Yara", speaker_name: "Yara", arabic_name: "يارا", gender: "female", tags: ["شابة", "حيوية"], reference_text: "", audio_url: "voices/Yara" },
];

export function loadParams(): Params {
  try {
    const p = JSON.parse(localStorage.getItem("voicetut-params") || "null");
    if (p && typeof p.numStep === "number") return { ...DEFAULT_PARAMS, ...p };
  } catch {
    /* ignore invalid persisted settings */
  }
  return DEFAULT_PARAMS;
}
