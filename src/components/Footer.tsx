export function Footer() {
  return (
    <footer className="border-t border-[#E7E0D3] bg-[#F5F1E8] py-10 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <p className="font-display text-lg font-semibold text-[#1C1917]">
            Orquestra Evangélica de Curitiba
          </p>
          <p className="mt-1 text-xs sm:text-sm text-[#57534E]">
            Curitiba, Paraná <span aria-hidden="true">·</span> Ensaios semanais e apresentações sacras <span aria-hidden="true">·</span> orquestraevangelicadecuritiba@gmail.com
          </p>
        </div>

        <nav aria-label="Links do rodapé" className="flex flex-wrap items-center gap-6 text-xs sm:text-sm text-[#57534E]">
          <a href="#repertorio" className="hover:text-[#1E3A5F] transition-colors">
            Repertório Público
          </a>
          <a href="#instrumentos" className="hover:text-[#1E3A5F] transition-colors">
            Instrumentos
          </a>
          <a href="#partituras" className="hover:text-[#1E3A5F] transition-colors">
            Partituras Privadas
          </a>
          <a href="#inscricao" className="hover:text-[#1E3A5F] transition-colors">
            Inscrição
          </a>
        </nav>
      </div>
    </footer>
  );
}
