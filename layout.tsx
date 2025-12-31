import "./globals.css";
export const metadata = { title: "Greek God Aesthetic Meal Planner", description: "Personalized macros + meal plans" };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return (<html lang="en"><body><div className="container">{children}</div></body></html>);
}
