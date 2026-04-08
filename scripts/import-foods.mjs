import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ztupsnpxqyiyfezzgkbp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0dXBzbnB4cXlpeWZlenpna2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MzE0ODksImV4cCI6MjA5MTIwNzQ4OX0.KawbLqlamVg8Xy-ykBh8KUtbd7r0TsQgMHunzqRlx5E';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('Fetching food data from Matvaretabellen...');
const res = await fetch('http://www.matvaretabellen.no/api/nb/foods.json');
const data = await res.json();

const foods = data.foods ?? data;
console.log(`Fetched ${foods.length} foods`);

function getNutrient(food, id) {
  const n = food.constituents?.find(c => c.nutrientId === id);
  return n?.quantity != null ? parseFloat(n.quantity) : null;
}

const rows = foods.map(food => ({
  name: food.foodName,
  energy_kcal: getNutrient(food, 'Enerc'),
  protein: getNutrient(food, 'Protein'),
  fat: getNutrient(food, 'Fat'),
  carbohydrates: getNutrient(food, 'Carb'),
  sodium: getNutrient(food, 'Na'),
  potassium: getNutrient(food, 'K'),
  phosphorus: getNutrient(food, 'P'),
})).filter(f => f.name);

console.log(`Prepared ${rows.length} rows for import`);

// Insert in batches of 200
const batchSize = 200;
for (let i = 0; i < rows.length; i += batchSize) {
  const batch = rows.slice(i, i + batchSize);
  const { error } = await supabase.from('foods').insert(batch);
  if (error) {
    console.error(`Batch ${i / batchSize + 1} failed:`, error.message);
  } else {
    console.log(`Inserted batch ${i / batchSize + 1}/${Math.ceil(rows.length / batchSize)}`);
  }
}

console.log('Done!');
