import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Topbar() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  return (
    <div className="topbar">
      <div>
        <div style={{fontWeight:900,fontSize:18}}>Greek God Aesthetic Meal Planner</div>
        <div className="small">Google login • 7-day plans • Grocery list • Check-ins • Admin macro tweaks</div>
      </div>
      <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
        <Link href="/">Home</Link>
        {user ? (
          <>
            <Link href="/app">Planner</Link>
            <Link href="/plans">Plans</Link>
            <Link href="/checkins">Check-ins</Link>
            <Link href="/admin">Admin</Link>
            <form className="no-print" action="/auth/signout" method="post">
              <button className="btn secondary" type="submit">Sign out</button>
            </form>
          </>
        ) : (
          <Link href="/login" className="btn">Login</Link>
        )}
      </div>
    </div>
  );
}
