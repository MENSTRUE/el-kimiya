import { ArrowRight, BookOpenCheck, FolderOpen, GraduationCap, LibraryBig, LockKeyhole, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import '../library-v64-adaptive.css';

type Props = {
  english: boolean;
  checking: boolean;
  count: number;
  onChooseFolder: () => void;
  onBrowseCatalog: () => void;
};

/**
 * Intentional empty state: 8 catalogue references !== 8 hosted PDFs.
 * Always offer working actions. The browser File API lets users open private
 * PDFs in the existing reader without uploading them to El-Kīmiyā servers.
 */
export function LibraryEmptyStateV64({ english, checking, count, onChooseFolder, onBrowseCatalog }: Props) {
  const tx = (id: string, en: string) => english ? en : id;
  return <section className="library64-empty" aria-label={tx('Persiapan perpustakaan pribadi', 'Set up your private library')}>
    <div className="library64-spotlight">
      <div className="library64-copy">
        <span className="library64-eyebrow"><Sparkles size={15}/>{tx('RUANG BACA PRIBADI', 'PRIVATE READING SPACE')}</span>
        <h3>{tx('Buku belum terhubung.', 'Your books are not connected yet.')}<br/><em>{tx('Belajar tetap bisa dimulai.', 'Learning can still begin.')}</em></h3>
        <p>{tx(`${count} judul sudah tercatat di katalog, tetapi berkas PDF-nya tidak disimpan di website publik. Hubungkan PDF milikmu untuk membaca, atau lanjutkan belajar tanpa buku.`,
          `${count} reference titles are listed, but their PDF files are not hosted on the public site. Connect your own PDFs to read, or continue learning without a book.`)}</p>
        <div className="library64-actions">
          <button type="button" className="library64-primary" onClick={onChooseFolder}><FolderOpen size={18}/>{tx('Pilih folder PDF', 'Choose PDF folder')}<ArrowRight size={17}/></button>
          <button type="button" className="library64-secondary" onClick={onBrowseCatalog}><LibraryBig size={17}/>{tx('Pilih satu buku', 'Choose one book')}</button>
        </div>
        <span className="library64-privacy"><LockKeyhole size={16}/>{checking ? tx('Memeriksa koneksi PDF lokal…', 'Checking local PDF access…') : tx('Buku dibuka di browser, tidak dikirim ke server El-Kīmiyā.', 'PDFs open in your browser, not on El-Kīmiyā servers.')}</span>
      </div>
      <div className="library64-illustration" aria-hidden="true">
        <div className="library64-orbit orbit-a"/><div className="library64-orbit orbit-b"/>
        <div className="library64-book library64-book--rear"><span>CHEMISTRY</span><b>CO₂</b></div>
        <div className="library64-book library64-book--front"><span>EL-KĪMIYĀ / STUDY</span><b>H₂O</b><small>PERSONAL READING</small></div>
        <div className="library64-book-star"><BookOpenCheck size={28}/></div>
      </div>
    </div>
    <div className="library64-next">
      <div className="library64-next-copy"><strong>{tx('Belum punya PDF? Tidak masalah.', 'No PDF? You can still learn.')}</strong><span>{tx('Latihan dan progres tidak bergantung pada buku PDF.', 'Practice and progress work independently of PDF files.')}</span></div>
      <a href="#practice"><GraduationCap size={17}/>{tx('Mulai latihan', 'Start practice')}<ArrowRight size={15}/></a>
      <a href="#progress"><TrendingUp size={17}/>{tx('Lihat progres', 'View progress')}<ArrowRight size={15}/></a>
    </div>
    <p className="library64-disclaimer"><ShieldCheck size={16}/>{tx('Katalog menampilkan metadata referensi, bukan akses otomatis ke file atau izin membagikan buku berhak cipta.',
      'The catalogue shows reference metadata, not automatic file access or permission to distribute copyrighted books.')}</p>
  </section>;
}
