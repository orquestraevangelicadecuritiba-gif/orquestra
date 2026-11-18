import { useCallback, useEffect, useState } from 'react';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { InstrumentMaterialsSection } from './components/InstrumentMaterialsSection';
import { MemberPortalModal } from './components/MemberPortalModal';
import { MusicianRegistrationSection } from './components/MusicianRegistrationSection';
import { Navbar } from './components/Navbar';
import { PdfPreviewModal } from './components/PdfPreviewModal';
import { PublicRepertoireSection } from './components/PublicRepertoireSection';
import { INITIAL_REPERTOIRE, INITIAL_SHEET_MUSIC } from './data/orchestraCatalog';
import { isSupabaseConfigured, supabase } from './lib/supabaseClient';
import {
  fetchPublicRepertoire,
  fetchSheetMusicArchive,
  getCurrentSessionProfile,
} from './services/orchestraService';
import { MusicianProfile, RepertoireTrack, SheetMusicPart } from './types/orchestra';

export default function App() {
  const [profile, setProfile] = useState<MusicianProfile | null>(null);
  const [tracks, setTracks] = useState<RepertoireTrack[]>(INITIAL_REPERTOIRE);
  const [sheets, setSheets] = useState<SheetMusicPart[]>(INITIAL_SHEET_MUSIC);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('all');
  const [portalOpen, setPortalOpen] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);

  const [pdfPreview, setPdfPreview] = useState<{
    url: string | null;
    title: string;
    fileName: string;
  }>({
    url: null,
    title: '',
    fileName: '',
  });

  const refreshArchive = useCallback(async (activeProfile: MusicianProfile | null) => {
    const [rep, sheetList] = await Promise.all([
      fetchPublicRepertoire(),
      fetchSheetMusicArchive(activeProfile),
    ]);
    setTracks(rep);
    setSheets(sheetList);
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const current = await getCurrentSessionProfile();
      if (!mounted) return;
      setProfile(current);
      await refreshArchive(current);
    };

    void init();

    if (isSupabaseConfigured && supabase) {
      const { data: listener } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setRecoveryMode(true);
          setPortalOpen(true);
        }
        void getCurrentSessionProfile().then((nextProfile) => {
          if (!mounted) return;
          setProfile(nextProfile);
          void refreshArchive(nextProfile);
        });
      });

      return () => {
        mounted = false;
        listener.subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, [refreshArchive]);

  const handleProfileChange = (next: MusicianProfile | null) => {
    setProfile(next);
    void refreshArchive(next);
  };

  const handleSelectTrackForSheets = (trackId: string) => {
    setSelectedTrackId(trackId);
    const el = document.getElementById('partituras');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleClosePdfPreview = () => {
    if (pdfPreview.url && pdfPreview.url.startsWith('blob:')) {
      URL.revokeObjectURL(pdfPreview.url);
    }
    setPdfPreview({ url: null, title: '', fileName: '' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#1C1917]">
      <Navbar profile={profile} onOpenPortal={() => setPortalOpen(true)} />

      <main className="flex-1">
        <HeroSection />

        <PublicRepertoireSection
          tracks={tracks}
          selectedTrackId={selectedTrackId}
          onSelectTrackForSheets={handleSelectTrackForSheets}
        />

        <InstrumentMaterialsSection
          tracks={tracks}
          sheets={sheets}
          selectedTrackId={selectedTrackId}
          onChangeTrackId={setSelectedTrackId}
          profile={profile}
          onOpenPortal={() => setPortalOpen(true)}
          onPreviewPdf={(url, title, fileName) =>
            setPdfPreview({ url, title, fileName })
          }
        />

        <MusicianRegistrationSection
          profile={profile}
          onAuthenticated={handleProfileChange}
          onOpenPortal={() => setPortalOpen(true)}
        />
      </main>

      <Footer />

      <MemberPortalModal
        open={portalOpen}
        onClose={() => {
          setPortalOpen(false);
          setRecoveryMode(false);
        }}
        profile={profile}
        tracks={tracks}
        recoveryMode={recoveryMode}
        onRecoveryDone={() => setRecoveryMode(false)}
        onProfileChange={handleProfileChange}
        onSheetsUpdated={() => void refreshArchive(profile)}
      />

      <PdfPreviewModal
        url={pdfPreview.url}
        title={pdfPreview.title}
        fileName={pdfPreview.fileName}
        onClose={handleClosePdfPreview}
      />
    </div>
  );
}
