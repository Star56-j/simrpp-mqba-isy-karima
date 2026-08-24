export function shareToWhatsApp(title: string, summary: string) {
  const text = `*${title.toUpperCase()}*\n\n${summary}\n\n_Dikirim otomatis dari SIMRPP MQBA_`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}
