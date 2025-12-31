export type Goal = "cut" | "maintain" | "bulk";
export type DietType = "standard" | "high_protein" | "low_carb" | "vegetarian" | "vegan";

export const ALLERGY_OPTIONS = [
  "None","Dairy-Free","Gluten-Free","Nut-Free","Egg-Free","Soy-Free","Fish-Free","Shellfish-Free",
] as const;

export const PREFERRED_PROTEIN_OPTIONS = [
  "No preference","Chicken","Turkey","Lean beef","Fish (salmon/white fish)","Eggs",
  "Greek yogurt / cottage cheese","Tofu / tempeh","Lentils / beans","Whey protein","Plant protein",
] as const;

export const AVOID_FOOD_OPTIONS = [
  "None","Red meat","Fish","Eggs","Dairy","Gluten","Nuts","Soy","Oats","Rice","Potatoes","Legumes",
] as const;

export type Inputs = {
  goal: Goal;
  activity: number;
  mealsPerDay: 3|4|5;
  heightFt: number;
  heightIn: number;
  weightLb: number;
  sex?: "male" | "female";
  age?: number;
  dietType: DietType;
  allergies: string[];      // 3 selects
  preferredProtein: string;
  avoidFood: string;
};

export type Targets = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  perMeal: { calories:number; protein_g:number; carbs_g:number; fats_g:number };
};

export type MealRow = { meal: string; foods: string; portions: string };

const lbToKg = (lb:number)=>lb*0.45359237;
const inchesToCm = (inch:number)=>inch*2.54;
const round = (n:number)=>Math.round(n);
const clamp=(n:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,n));

function uniqueNonNone(list:string[]) {
  const s=new Set<string>();
  for(const x of list) if(x && x!=="None") s.add(x);
  return Array.from(s);
}
function hasRestriction(restrictions:string[], name:string){ return restrictions.includes(name); }

function isAvoided(item:string, avoid:string) {
  if(!avoid || avoid==="None") return false;
  const a=avoid.toLowerCase();
  return item.toLowerCase().includes(a) ||
    (a==="dairy" && /(yogurt|milk|cheese|whey)/i.test(item)) ||
    (a==="gluten" && /(bread|pasta|wrap|tortilla)/i.test(item)) ||
    (a==="nuts" && /(peanut|almond|nuts)/i.test(item)) ||
    (a==="soy" && /(tofu|tempeh|soy)/i.test(item)) ||
    (a==="fish" && /(salmon|tuna|fish)/i.test(item)) ||
    (a==="eggs" && /(egg)/i.test(item)) ||
    (a==="rice" && /(rice)/i.test(item)) ||
    (a==="potatoes" && /(potato)/i.test(item)) ||
    (a==="legumes" && /(lentil|beans|chickpeas)/i.test(item));
}

export function calcTargets(i: Inputs): Targets {
  const heightIn = i.heightFt*12 + i.heightIn;
  const heightCm = inchesToCm(heightIn);
  const weightKg = lbToKg(i.weightLb);
  const sex = i.sex ?? "male";
  const age = i.age ?? 25;

  const bmr = 10*weightKg + 6.25*heightCm - 5*age + (sex==="male"?5:-161);
  const tdee = bmr * i.activity;

  let calories = tdee;
  if(i.goal==="cut") calories=tdee*0.85;
  if(i.goal==="bulk") calories=tdee*1.10;

  let proteinPerLb = i.goal==="cut"?0.9:(i.goal==="maintain"?0.8:0.75);
  if(i.dietType==="high_protein") proteinPerLb += 0.1;

  let protein_g = proteinPerLb*i.weightLb;
  let fats_g = 0.3*i.weightLb;
  if(i.dietType==="low_carb") fats_g = 0.4*i.weightLb;

  const proteinCal=protein_g*4;
  const fatCal=fats_g*9;
  let carbsCal = calories - proteinCal - fatCal;
  carbsCal = Math.max(carbsCal,0);
  let carbs_g = carbsCal/4;

  if(i.dietType==="vegan"){
    carbs_g *= 1.05;
    protein_g = Math.max(protein_g, 0.8*i.weightLb);
  }

  calories=round(calories);
  protein_g=round(protein_g);
  carbs_g=round(carbs_g);
  fats_g=round(fats_g);

  const perMeal = {
    calories: round(calories/i.mealsPerDay),
    protein_g: round(protein_g/i.mealsPerDay),
    carbs_g: round(carbs_g/i.mealsPerDay),
    fats_g: round(fats_g/i.mealsPerDay),
  };
  return {calories, protein_g, carbs_g, fats_g, perMeal};
}

function portionsForMeal(perMeal: Targets["perMeal"], diet: DietType) {
  const {protein_g, carbs_g, fats_g} = perMeal;
  const out:string[]=[];
  if(diet==="vegan"||diet==="vegetarian"){
    const scoops=clamp(protein_g/25,0.5,3);
    out.push(`${scoops.toFixed(1)} scoops protein`);
  } else {
    const grams=clamp(protein_g/0.25,80,280);
    out.push(`${round(grams)} g protein source`);
  }

  if(diet==="low_carb"){
    if(carbs_g<=30) out.push(`${round(carbs_g)} g carbs (fruit/veg)`);
    else {
      const grams=clamp(carbs_g/0.28,80,350);
      out.push(`${round(grams)} g cooked carb (rice/potato alt)`);
    }
  } else {
    const grams=clamp(carbs_g/0.28,80,450);
    out.push(`${round(grams)} g cooked carbs`);
  }

  const tbsp=clamp(fats_g/14,0.5,3);
  out.push(`${tbsp.toFixed(1)} tbsp fats (oil/nut butter/avocado)`);
  return out.join(" • ");
}

function buildProteinPool(diet:DietType, restrictions:string[]) {
  let pool:string[]=["chicken breast","turkey breast","lean beef","salmon","white fish","eggs","Greek yogurt","whey protein"];
  if(diet==="vegetarian") pool=["eggs","Greek yogurt","cottage cheese","tofu","tempeh","lentils","beans","plant protein"];
  if(diet==="vegan") pool=["tofu","tempeh","lentils","beans","chickpeas","plant protein"];

  if(hasRestriction(restrictions,"Dairy-Free")) pool=pool.filter(p=>!/(yogurt|cottage|whey)/i.test(p));
  if(hasRestriction(restrictions,"Egg-Free")) pool=pool.filter(p=>!/(egg)/i.test(p));
  if(hasRestriction(restrictions,"Soy-Free")) pool=pool.filter(p=>!/(tofu|tempeh|soy)/i.test(p));
  if(hasRestriction(restrictions,"Fish-Free")||hasRestriction(restrictions,"Shellfish-Free")) pool=pool.filter(p=>!/(salmon|fish|shrimp|shellfish)/i.test(p));
  return pool;
}

function preferenceBoost(pool:string[], preferredProtein:string){
  const keyMap:Record<string,string>={
    "Chicken":"chicken","Turkey":"turkey","Lean beef":"beef","Fish (salmon/white fish)":"fish","Eggs":"egg",
    "Greek yogurt / cottage cheese":"yogurt","Tofu / tempeh":"tofu","Lentils / beans":"lentil","Whey protein":"whey","Plant protein":"plant",
  };
  const k=keyMap[preferredProtein] ?? preferredProtein.toLowerCase();
  if(preferredProtein && preferredProtein!=="No preference"){
    pool.sort((a,b)=> (a.includes(k)?-1:0) - (b.includes(k)?-1:0));
  }
  return pool;
}

function pickFoodsDay(i:Inputs, seed:number){
  const restrictions=uniqueNonNone(i.allergies);
  let pool = preferenceBoost(buildProteinPool(i.dietType, restrictions), i.preferredProtein);
  pool = pool.filter(p=>!isAvoided(p, i.avoidFood));
  if(pool.length===0) pool=["lean protein"];

  const rand = (n:number)=>Math.abs(Math.sin(seed++))*n;
  const pick = (arr:string[])=>arr[Math.floor(rand(arr.length))%arr.length];

  const carbs = i.dietType==="low_carb"
    ? ["berries","mixed veggies","cauliflower rice","zucchini noodles"]
    : ["oats","rice","sweet potato","potatoes","quinoa","fruit","beans","lentils"];

  const fats = ["olive oil","avocado","peanut butter"];

  const pB=pick(pool), pL=pick(pool), pD=pick(pool);
  const pS=(i.dietType==="vegan"||i.dietType==="vegetarian") ? "plant protein" : "whey protein";
  const dairyFree = restrictions.includes("Dairy-Free") || i.dietType==="vegan";
  const snack2p = dairyFree ? "plant protein" : "Greek yogurt";

  const c1 = pick(carbs), c2 = pick(carbs), c3 = pick(carbs);
  const f1 = (restrictions.includes("Nut-Free") || i.avoidFood==="Nuts") ? "olive oil" : pick(fats);
  const f2 = "olive oil";
  const f3 = "avocado";

  const day = {
    breakfast:[c1,pB,"berries",f3].filter(x=>!isAvoided(x,i.avoidFood)),
    snack1:[pS,"banana",f1].filter(x=>!isAvoided(x,i.avoidFood)),
    lunch:[pL,c2,"mixed veggies",f2].filter(x=>!isAvoided(x,i.avoidFood)),
    snack2:[snack2p,"fruit"].filter(x=>!isAvoided(x,i.avoidFood)),
    dinner:[pD,c3,"veggies",f2].filter(x=>!isAvoided(x,i.avoidFood)),
  };
  return { day, restrictions };
}

function mealsOrder(mealsPerDay:3|4|5){
  return mealsPerDay===3?["breakfast","lunch","dinner"]:mealsPerDay===4?["breakfast","snack1","lunch","dinner"]:["breakfast","snack1","lunch","snack2","dinner"];
}

export function generateDayPlan(i:Inputs){
  const targets = calcTargets(i);
  const { day, restrictions } = pickFoodsDay(i, Date.now()%1000);
  const order = mealsOrder(i.mealsPerDay);
  const rows:MealRow[] = order.map(k=>{
    const meal = k==="breakfast"?"Breakfast":k==="lunch"?"Lunch":k==="dinner"?"Dinner":"Snack";
    return { meal, foods:(day as any)[k].join(", "), portions: portionsForMeal(targets.perMeal, i.dietType) };
  });
  return { targets, rows, meta:{restrictions} };
}

export function generateWeekPlan(i:Inputs){
  const targets = calcTargets(i);
  const week = Array.from({length:7},(_,d)=>{
    const { day, restrictions } = pickFoodsDay(i, d+1);
    const order = mealsOrder(i.mealsPerDay);
    const rows:MealRow[] = order.map(k=>{
      const meal = k==="breakfast"?"Breakfast":k==="lunch"?"Lunch":k==="dinner"?"Dinner":"Snack";
      return { meal, foods:(day as any)[k].join(", "), portions: portionsForMeal(targets.perMeal, i.dietType) };
    });
    return { dayIndex:d, restrictions, rows };
  });

  const grocery = buildGroceryList(week);
  return { targets, week, grocery, meta:{restrictions: uniqueNonNone(i.allergies)} };
}

type GroceryItem = { item: string; count: number };
export function buildGroceryList(week:{rows:MealRow[]}[]){
  // Simple aggregation by ingredient token in "foods"
  const map = new Map<string, number>();
  for(const d of week){
    for(const r of d.rows){
      const parts = r.foods.split(",").map(s=>s.trim()).filter(Boolean);
      for(const p of parts){
        map.set(p, (map.get(p)??0)+1);
      }
    }
  }
  const items: GroceryItem[] = Array.from(map.entries()).map(([item,count])=>({item,count}))
    .sort((a,b)=>b.count-a.count);
  return items;
}

export function groceryToCSV(items:{item:string;count:number}[]){
  const rows = [["Item","Times used (approx)"], ...items.map(x=>[x.item,String(x.count)])];
  return rows.map(r => r.map(v => `"${v.replaceAll('"','""')}"`).join(",")).join("\n");
}

export function applyMacroOverride(t:Targets, override:{calories?:number; protein_g?:number; carbs_g?:number; fats_g?:number}, mealsPerDay:number): Targets {
  const calories = override.calories ?? t.calories;
  const protein_g = override.protein_g ?? t.protein_g;
  const carbs_g = override.carbs_g ?? t.carbs_g;
  const fats_g = override.fats_g ?? t.fats_g;
  return {
    calories, protein_g, carbs_g, fats_g,
    perMeal: {
      calories: round(calories/mealsPerDay),
      protein_g: round(protein_g/mealsPerDay),
      carbs_g: round(carbs_g/mealsPerDay),
      fats_g: round(fats_g/mealsPerDay),
    }
  };
}
