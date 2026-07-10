/* ================================================================
   FavoritesPage — /favorites : 별표로 표시한 강의 모아보기
   store.favorites(강의 id) 기준. 게스트는 비어 있음.
   ================================================================ */
import { useNavigate } from "react-router";
import { Star } from "lucide-react";
import { useApp } from "./store";

export default function FavoritesPage() {
  const { lectures, folders, favorites, authed, toggleFavorite } = useApp();
  const navigate = useNavigate();
  const favs = authed ? lectures.filter((l) => favorites.includes(l.id)) : [];

  return (
    <div className="mx-auto max-w-[1400px] px-8 py-7">
      <h1 className="text-[26px] font-bold tracking-tight text-card-foreground">즐겨찾기</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">
        별표로 표시한 강의{favs.length ? ` · ${favs.length}개` : ""}
      </p>

      {favs.length === 0 ? (
        <div className="mt-28 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
            <Star size={26} className="text-muted-foreground" />
          </div>
          <h2 className="mt-5 text-[19px] font-bold text-card-foreground">즐겨찾기한 강의가 없어요</h2>
          <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-muted-foreground">
            강의 카드의 ⋯ 메뉴에서 “즐겨찾기 추가”를 누르면 여기에 모여요.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {favs.map((lec) => (
            <div
              key={lec.id}
              onClick={() => navigate(`/lecture/${lec.id}`)}
              className="card-lift group cursor-pointer overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="relative h-36 overflow-hidden border-b border-border bg-gradient-to-br from-[#FBF7F1] to-[#F3EDE4]">
                {(lec.id.startsWith("bt") || lec.id.startsWith("cn") || ["w10", "is05", "cnref"].includes(lec.id)) && (
                  <img
                    src={`/slides/${lec.id.startsWith("bt") ? "bt" : lec.id.startsWith("cn") ? "cn" : "zk"}/p1.png`}
                    alt="" className="h-full w-full object-cover object-top opacity-90" loading="lazy"
                  />
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(lec.id); }}
                  title="즐겨찾기 해제"
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-[var(--ember)] shadow-sm transition-colors hover:bg-white"
                >
                  <Star size={15} fill="currentColor" />
                </button>
              </div>
              <div className="p-4">
                <h3 className="text-[15px] font-semibold text-card-foreground">{lec.title}</h3>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {folders.find((f) => f.id === lec.folderId)?.name} · {lec.updatedLabel}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
