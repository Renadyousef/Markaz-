// client/src/components/Pages/DeckView.jsx
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export default function DeckView() {
  const { deckId } = useParams();
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let stop = false;
    async function run() {
      setLoading(true); setErr("");
      try {
        const res = await axios.get(`${API}/retrive/decks/${deckId}/cards`);
        if (!stop) {
          if (res.data?.ok) { setDeck(res.data.deck); setCards(res.data.cards || []); }
          else setErr(res.data?.error || "فشل الجلب");
        }
      } catch (e) {
        if (!stop) setErr(e?.response?.data?.error || e.message);
      } finally {
        if (!stop) setLoading(false);
      }
    }
    run();
    return () => { stop = true; };
  }, [deckId]);

  return (
    <div className="hp">
      <section className="panel">
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <h3>{deck ? (deck.name || deck.id) : "..."}</h3>
          <Link to="/cards" className="back">رجوع</Link>
        </div>

        {loading && <div>جارٍ التحميل...</div>}
        {err && <div style={{color:"#b00020"}}>خطأ: {err}</div>}

        {!loading && !err && cards.map(c => (
          <article key={c.id} style={{border:"1px solid #e5e7eb", borderRadius:12, padding:12, marginBottom:10}}>
            <div style={{fontWeight:900, marginBottom:6}}>التعريف</div>
            <div style={{marginBottom:10}}>{c.answer}</div>
            <div style={{fontWeight:900, marginBottom:6}}>المصطلح</div>
            <div>{c.question}</div>
          </article>
        ))}

        {!loading && !err && cards.length === 0 && <div>لا توجد بطاقات في هذه المجموعة.</div>}
      </section>
    </div>
  );
}
