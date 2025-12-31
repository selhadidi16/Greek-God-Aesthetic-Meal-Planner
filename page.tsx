import Topbar from "../_components/Topbar";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function PlansPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return (
      <>
        {/* @ts-expect-error Async Server Component */}
        <Topbar />
        <div className="card">
          <h2 style={{marginTop:0}}>Plans</h2>
          <p className="small">Please log in to view saved plans.</p>
          <Link className="btn" href="/login">Login</Link>
        </div>
      </>
    );
  }

  const { data: plans, error } = await supabase
    .from("meal_plans")
    .select("id, created_at, calories, protein_g, carbs_g, fats_g")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <>
      {/* @ts-expect-error Async Server Component */}
      <Topbar />
      <div className="card">
        <h2 style={{marginTop:0}}>Saved Plans</h2>
        {error && <div className="small">{error.message}</div>}
        {!plans?.length ? (
          <p className="small">No plans yet. Go generate one in Planner.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Calories</th><th>Protein</th><th>Carbs</th><th>Fats</th><th></th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id}>
                  <td>{new Date(p.created_at).toLocaleString()}</td>
                  <td>{p.calories}</td>
                  <td>{p.protein_g} g</td>
                  <td>{p.carbs_g} g</td>
                  <td>{p.fats_g} g</td>
                  <td>
                    <Link href={`/plans/${p.id}`}>View</Link>{" "}
                    | <Link href={`/plans/${p.id}/print`}>Print / PDF</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
