import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !key || url === 'your_supabase_url') {
  console.error('❌ Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local first');
  process.exit(1);
}

const supabase = createClient(url, key);

async function seedIfEmpty(table: string, rows: Record<string, unknown>[]) {
  const { data } = await supabase.from(table).select('id').limit(1);
  if (data && data.length > 0) {
    console.log(`  ⏭  ${table} — already has data, skipping`);
    return;
  }
  const { error } = await supabase.from(table).insert(rows);
  if (error) {
    console.error(`  ❌ ${table} — ${error.message}`);
  } else {
    console.log(`  ✅ ${table} — seeded ${rows.length} rows`);
  }
}

async function main() {
  console.log('🌱 Seeding J & S database...\n');

  // ── Bucket List ──
  await seedIfEmpty('bucket_list', [
    { text: 'Dance in the rain together', emoji: '💃', completed: false, category: 'Dates' },
    { text: 'Watch the sunrise', emoji: '🌅', completed: false, category: 'Dates' },
    { text: 'Build a blanket fort', emoji: '🏰', completed: false, category: 'Creative' },
    { text: 'Go stargazing', emoji: '⭐', completed: false, category: 'Dates' },
    { text: 'Have a picnic in the park', emoji: '🧺', completed: false, category: 'Dates' },
    { text: 'Write love letters to each other', emoji: '💌', completed: false, category: 'Creative' },
    { text: 'Cook a fancy dinner together', emoji: '👨‍🍳', completed: false, category: 'Daily' },
    { text: 'Take a pottery class', emoji: '🏺', completed: false, category: 'Creative' },
    { text: 'Road trip with no plan', emoji: '🚗', completed: false, category: 'Travel' },
    { text: 'See the Northern Lights', emoji: '🌌', completed: false, category: 'Travel' },
    { text: 'Skinny dip together', emoji: '🏊', completed: false, category: 'Dates' },
    { text: 'Plant a garden or tree', emoji: '🌱', completed: false, category: 'Creative' },
    { text: 'Attend a music festival', emoji: '🎶', completed: false, category: 'Dates' },
    { text: 'Learn a dance', emoji: '🕺', completed: false, category: 'Creative' },
    { text: 'Adopt a pet', emoji: '🐾', completed: false, category: 'Milestones' },
    { text: 'Go scuba diving', emoji: '🤿', completed: false, category: 'Travel' },
    { text: 'Hot air balloon ride', emoji: '🎈', completed: false, category: 'Travel' },
    { text: 'Run a race together (5K, 10K)', emoji: '🏃', completed: false, category: 'Milestones' },
    { text: 'Stay in an overwater bungalow', emoji: '🏝️', completed: false, category: 'Travel' },
    { text: 'Visit Tokyo', emoji: '🗼', completed: false, category: 'Travel' },
    { text: 'Go camping under the stars', emoji: '⛺', completed: false, category: 'Travel' },
    { text: "Take a couple's cooking class", emoji: '🍳', completed: false, category: 'Creative' },
    { text: 'Volunteer together', emoji: '🤝', completed: false, category: 'Milestones' },
    { text: 'Write a bucket list for each decade', emoji: '📝', completed: false, category: 'Creative' },
    { text: 'Have a movie marathon day', emoji: '🎬', completed: false, category: 'Daily' },
    { text: 'Take a helicopter ride', emoji: '🚁', completed: false, category: 'Travel' },
    { text: 'Recreate our first date', emoji: '🥰', completed: false, category: 'Dates' },
    { text: 'Go to Disneyland/Disney World', emoji: '🏰', completed: false, category: 'Travel' },
    { text: 'Create a time capsule', emoji: '📦', completed: false, category: 'Creative' },
    { text: 'Move in together', emoji: '🏠', completed: false, category: 'Milestones' },
    { text: 'Travel to 10 countries together', emoji: '✈️', completed: false, category: 'Travel' },
    { text: 'Have a paint night', emoji: '🎨', completed: false, category: 'Creative' },
    { text: 'Get matching tattoos', emoji: '💉', completed: false, category: 'Milestones' },
    { text: 'Binge a new series together', emoji: '📺', completed: false, category: 'Daily' },
    { text: 'Try karaoke together', emoji: '🎤', completed: false, category: 'Dates' },
    { text: 'Visit a Christmas market', emoji: '🎄', completed: false, category: 'Dates' },
    { text: 'Try bungee jumping or skydiving', emoji: '🪂', completed: false, category: 'Travel' },
    { text: 'Make homemade pasta', emoji: '🍝', completed: false, category: 'Daily' },
    { text: 'Go ice skating', emoji: '⛸️', completed: false, category: 'Dates' },
    { text: 'Take a sunset boat ride', emoji: '🚤', completed: false, category: 'Dates' },
    { text: 'Build something with our hands', emoji: '🔨', completed: false, category: 'Creative' },
    { text: 'Go to a drive-in movie', emoji: '🚙', completed: false, category: 'Dates' },
    { text: 'Slow dance in the living room', emoji: '💕', completed: false, category: 'Daily' },
    { text: 'Watch all the Studio Ghibli films', emoji: '🎌', completed: false, category: 'Daily' },
    { text: 'Go horseback riding', emoji: '🐴', completed: false, category: 'Dates' },
    { text: 'Visit a vineyard / wine tasting', emoji: '🍷', completed: false, category: 'Dates' },
    { text: 'Learn a new language together', emoji: '🗣️', completed: false, category: 'Creative' },
  ]);

  // ── Alphabet Dating ──
  await seedIfEmpty('alphabet_dating', [
    { letter: 'A', activities: 'Aquarium, Art gallery, Archery', completed: false },
    { letter: 'B', activities: 'Bowling, Beach day, Brunch', completed: false },
    { letter: 'C', activities: 'Cooking class, Cinema, Camping', completed: false },
    { letter: 'D', activities: 'Dancing, Drive-in, Dessert crawl', completed: false },
    { letter: 'E', activities: 'Escape room, Explore a new town', completed: false },
    { letter: 'F', activities: 'Farmers market, Fishing, Fondue', completed: false },
    { letter: 'G', activities: 'Go-karting, Game night, Gardening', completed: false },
    { letter: 'H', activities: 'Hiking, Hot springs, Horse riding', completed: false },
    { letter: 'I', activities: 'Ice skating, Italian dinner, Island trip', completed: false },
    { letter: 'J', activities: 'Jazz bar, Jet skiing, Jigsaw puzzle', completed: false },
    { letter: 'K', activities: 'Kayaking, Karaoke, Kite flying', completed: false },
    { letter: 'L', activities: 'Laser tag, Library date, Live music', completed: false },
    { letter: 'M', activities: 'Museum, Mini golf, Movie marathon', completed: false },
    { letter: 'N', activities: 'Night market, Nature walk, Noodle bar', completed: false },
    { letter: 'O', activities: 'Observatory, Outdoor cinema, Opera', completed: false },
    { letter: 'P', activities: 'Picnic, Pottery class, Planetarium', completed: false },
    { letter: 'Q', activities: 'Quiz night, Quiet spa day', completed: false },
    { letter: 'R', activities: 'Rock climbing, Road trip, Roller skating', completed: false },
    { letter: 'S', activities: 'Sunset hike, Sushi making, Stargazing', completed: false },
    { letter: 'T', activities: 'Thrift shopping, Trampoline park, Tea ceremony', completed: false },
    { letter: 'U', activities: 'Underground tour, Ukulele lesson', completed: false },
    { letter: 'V', activities: 'Vineyard tour, Volleyball, Volunteer', completed: false },
    { letter: 'W', activities: 'Waterfall hike, Wine tasting, Waffle brunch', completed: false },
    { letter: 'X', activities: 'X-treme sport, Xmas market', completed: false },
    { letter: 'Y', activities: 'Yoga class, Yacht day, YouTube cooking', completed: false },
    { letter: 'Z', activities: 'Zoo visit, Zen garden, Zipline', completed: false },
  ]);

  // ── Books ──
  await seedIfEmpty('books', [
    { title: 'God of Malice', author: 'Rina Kent', series: 'Legacy of Gods #1', genre: 'Dark Romance', status: 'tbr' },
    { title: 'God of Pain', author: 'Rina Kent', series: 'Legacy of Gods #2', genre: 'Dark Romance', status: 'tbr' },
    { title: 'God of Wrath', author: 'Rina Kent', series: 'Legacy of Gods #3', genre: 'Dark Romance', status: 'tbr' },
    { title: 'God of Ruin', author: 'Rina Kent', series: 'Legacy of Gods #4', genre: 'Dark Romance', status: 'tbr' },
    { title: 'God of Fury', author: 'Rina Kent', series: 'Legacy of Gods #5', genre: 'Dark Romance', status: 'tbr' },
    { title: 'God of War', author: 'Rina Kent', series: 'Legacy of Gods #6', genre: 'Dark Romance', status: 'tbr' },
    { title: 'Cruel King', author: 'Rina Kent', series: 'Royal Elite #1', genre: 'Dark Romance', status: 'tbr' },
    { title: 'Deviant King', author: 'Rina Kent', series: 'Royal Elite #2', genre: 'Dark Romance', status: 'tbr' },
    { title: 'Steel Princess', author: 'Rina Kent', series: 'Royal Elite #3', genre: 'Dark Romance', status: 'tbr' },
    { title: 'Twisted Kingdom', author: 'Rina Kent', series: 'Royal Elite #4', genre: 'Dark Romance', status: 'tbr' },
    { title: 'Black Knight', author: 'Rina Kent', series: 'Royal Elite #5', genre: 'Dark Romance', status: 'tbr' },
    { title: 'Reign', author: 'Rina Kent', series: 'Royal Elite #6', genre: 'Dark Romance', status: 'tbr' },
    { title: 'Rise', author: 'Rina Kent', series: 'Royal Elite #7', genre: 'Dark Romance', status: 'tbr' },
    { title: 'Merged With Him', author: 'Kylie Kent', series: 'Merge #1', genre: 'Mafia Romance', status: 'tbr' },
    { title: 'Fused With Him', author: 'Kylie Kent', series: 'Merge #2', genre: 'Mafia Romance', status: 'tbr' },
    { title: 'Bonded With Him', author: 'Kylie Kent', series: 'Merge #3', genre: 'Mafia Romance', status: 'tbr' },
    { title: 'Entwined With Him', author: 'Kylie Kent', series: 'Merge #4', genre: 'Mafia Romance', status: 'tbr' },
    { title: 'Blended With Him', author: 'Kylie Kent', series: 'Merge #5', genre: 'Mafia Romance', status: 'tbr' },
    { title: 'Haunting Adeline', author: 'H.D. Carlton', series: 'Cat and Mouse Duet #1', genre: 'Dark Romance', status: 'read', rating: 5, read_date: '2024-06-01' },
    { title: 'Hunting Adeline', author: 'H.D. Carlton', series: 'Cat and Mouse Duet #2', genre: 'Dark Romance', status: 'read', rating: 5, read_date: '2024-07-01' },
  ]);

  // ── Watchlist ──
  await seedIfEmpty('watchlist', [
    { title: 'Tangled', type: 'movie', watched: true, watched_date: '2024-09-15' },
    { title: 'Beauty and the Beast', type: 'movie', watched: true, watched_date: '2024-08-20' },
    { title: 'Aladdin', type: 'movie', watched: true, watched_date: '2024-10-01' },
    { title: 'The Little Mermaid', type: 'movie', watched: false },
    { title: 'Moana', type: 'movie', watched: false },
    { title: 'Frozen', type: 'movie', watched: false },
    { title: 'Bridgerton', type: 'show', watched: false },
    { title: 'Emily in Paris', type: 'show', watched: false },
  ]);

  // ── Duets ──
  await seedIfEmpty('duets', [
    { title: 'Perfect', artist: 'Ed Sheeran', category: 'song', status: 'done' },
    { title: 'All of Me', artist: 'John Legend', category: 'song', status: 'done' },
    { title: 'A Thousand Years', artist: 'Christina Perri', category: 'song', status: 'in_progress' },
    { title: "Can't Help Falling in Love", artist: 'Elvis Presley', category: 'song', status: 'want_to_learn' },
    { title: 'Thinking Out Loud', artist: 'Ed Sheeran', category: 'song', status: 'want_to_learn' },
    { title: "Say You Won't Let Go", artist: 'James Arthur', category: 'song', status: 'in_progress' },
  ]);

  // ── Home Items ──
  await seedIfEmpty('home_items', [
    { name: 'Giant Teddy Bear', category: 'Decor', status: 'want', notes: 'The really big one from Costco' },
    { name: 'Human Dog Bed', category: 'Furniture', status: 'want', notes: 'For movie nights' },
    { name: 'Shower Bench', category: 'Bathroom', status: 'want', notes: 'Teak wood bench' },
    { name: 'Hidden Library Door', category: 'Furniture', status: 'want', notes: 'Secret bookshelf door' },
    { name: 'Oversized Rocking Chair', category: 'Furniture', status: 'want', notes: 'Big enough for two' },
  ]);

  // ── Dishes ──
  await seedIfEmpty('dishes', [
    { name: 'Malatang', made_it: false },
    { name: 'Cheung Fun', made_it: false },
    { name: 'Steak', made_it: false },
    { name: 'Omakase (at home)', made_it: false },
  ]);

  // ── Matching Items ──
  await seedIfEmpty('matching_items', [
    { category: 'Promise Rings', item_name: 'Sun & Moon matching rings', status: 'Want', notes: '', link: '', found_by: 'sophie' },
    { category: 'Promise Rings', item_name: 'Infinity band set', status: 'Want', notes: '', link: '', found_by: 'joshua' },
    { category: 'Bracelets', item_name: 'Long distance touch bracelets', status: 'Want', notes: 'Bond Touch', link: '', found_by: 'sophie' },
    { category: 'Bracelets', item_name: 'Coordinates engraved bangles', status: 'Want', notes: '', link: '', found_by: 'joshua' },
    { category: 'Necklaces', item_name: 'Lock & Key necklace set', status: 'Want', notes: '', link: '', found_by: 'sophie' },
    { category: 'Necklaces', item_name: 'Half-heart pendants', status: 'Want', notes: 'Classic but cute', link: '', found_by: 'joshua' },
    { category: 'Keychains', item_name: 'Puzzle piece keychains', status: 'Want', notes: '', link: '', found_by: 'sophie' },
    { category: 'Keychains', item_name: 'Custom photo keychain', status: 'Want', notes: '', link: '', found_by: 'joshua' },
    { category: 'Hoodies', item_name: 'Matching "His & Hers" hoodies', status: 'Want', notes: '', link: '', found_by: 'sophie' },
    { category: 'Hoodies', item_name: 'Anime couple hoodies', status: 'Want', notes: '', link: '', found_by: 'joshua' },
    { category: 'Shirts', item_name: 'Player 1 / Player 2 tees', status: 'Want', notes: '', link: '', found_by: 'joshua' },
    { category: 'Pants', item_name: 'Matching joggers', status: 'Want', notes: '', link: '', found_by: 'sophie' },
    { category: 'Socks', item_name: 'Custom face socks', status: 'Want', notes: "Each with the other person's face!", link: '', found_by: 'sophie' },
    { category: 'Shoes', item_name: 'Matching AF1 customs', status: 'Want', notes: '', link: '', found_by: 'joshua' },
  ]);

  // ── Q&A Questions ──
  await seedIfEmpty('qa_questions', [
    { question: 'How will we handle money when things get tight?', category: 'Financial', order_index: 1 },
    { question: 'Should we have joint accounts, separate accounts, or both?', category: 'Financial', order_index: 2 },
    { question: 'What are your financial goals for the next 5 years?', category: 'Financial', order_index: 3 },
    { question: 'How do you feel about lending money to family or friends?', category: 'Financial', order_index: 4 },
    { question: 'What is your approach to saving vs. spending?', category: 'Financial', order_index: 5 },
    { question: 'How much should we each contribute to shared expenses?', category: 'Financial', order_index: 6 },
    { question: 'Do you have any debts? How do you plan to handle them?', category: 'Credit & Debt', order_index: 7 },
    { question: 'What is your credit score and how do you feel about it?', category: 'Credit & Debt', order_index: 8 },
    { question: 'How do you feel about taking on debt for big purchases (house, car)?', category: 'Credit & Debt', order_index: 9 },
    { question: 'Do you want children? If so, how many and when?', category: 'Parenting', order_index: 10 },
    { question: 'What parenting style do you lean toward?', category: 'Parenting', order_index: 11 },
    { question: 'How would we handle disagreements about parenting?', category: 'Parenting', order_index: 12 },
    { question: 'What values are most important to instill in our children?', category: 'Parenting', order_index: 13 },
    { question: 'How do you feel about childcare and stay-at-home parenting?', category: 'Parenting', order_index: 14 },
    { question: 'Where do you see us living in 10 years?', category: 'Dream Life', order_index: 15 },
    { question: 'What does your ideal daily routine look like?', category: 'Dream Life', order_index: 16 },
    { question: 'What is your biggest dream or life goal?', category: 'Dream Life', order_index: 17 },
    { question: 'What does retirement look like for you?', category: 'Dream Life', order_index: 18 },
    { question: 'What are your biggest fears in a relationship?', category: 'Likes / Dislikes / Fears', order_index: 19 },
    { question: 'What habits of mine do you find most endearing?', category: 'Likes / Dislikes / Fears', order_index: 20 },
    { question: "What is something I do that bothers you but you haven't mentioned?", category: 'Likes / Dislikes / Fears', order_index: 21 },
    { question: 'What are your love languages in order of importance?', category: 'Likes / Dislikes / Fears', order_index: 22 },
    { question: 'How do you want to handle holidays and family visits?', category: 'Expectations', order_index: 23 },
    { question: 'What does a perfect weekend together look like?', category: 'Expectations', order_index: 24 },
    { question: 'How much alone time do you need?', category: 'Expectations', order_index: 25 },
    { question: 'What are your expectations around household chores?', category: 'Expectations', order_index: 26 },
    { question: 'How do you want to resolve conflicts?', category: 'Expectations', order_index: 27 },
    { question: 'What role does faith or spirituality play in your life?', category: 'Beliefs', order_index: 28 },
    { question: 'Are there any non-negotiable values or principles you hold?', category: 'Beliefs', order_index: 29 },
    { question: 'How do you feel about raising children with a specific faith?', category: 'Beliefs', order_index: 30 },
  ]);

  // ── Wedding Checklist ──
  await seedIfEmpty('wedding_checklist', [
    { category: "Joshua & Sophie's Combined Vision", item: 'Suit with pictures for reaction shots', checked: false },
    { category: "Joshua & Sophie's Combined Vision", item: 'Learn to dance together', checked: false },
    { category: "Joshua & Sophie's Combined Vision", item: 'First look setup', checked: false },
    { category: "Joshua & Sophie's Combined Vision", item: 'Write personal vows', checked: false },
    { category: "Joshua & Sophie's Combined Vision", item: 'Choose a wedding song', checked: false },
    { category: "Joshua & Sophie's Combined Vision", item: 'Plan the honeymoon destination', checked: false },
    { category: "Joshua & Sophie's Combined Vision", item: 'Design table centerpieces together', checked: false },
    { category: 'Invites', item: 'Finalize guest list', checked: false },
    { category: 'Invites', item: 'Choose invitation design', checked: false },
    { category: 'Invites', item: 'Include RSVP deadline', checked: false },
    { category: 'Invites', item: 'Add dietary requirements question', checked: false },
    { category: 'Invites', item: 'Send save-the-dates 6 months before', checked: false },
    { category: 'Invites', item: 'Send formal invites 3 months before', checked: false },
    { category: 'Invites', item: 'Create wedding website', checked: false },
    { category: 'On the Day', item: 'Morning timeline for bride', checked: false },
    { category: 'On the Day', item: 'Morning timeline for groom', checked: false },
    { category: 'On the Day', item: 'Ceremony rehearsal', checked: false },
    { category: 'On the Day', item: 'First dance practice', checked: false },
    { category: 'On the Day', item: 'Speech order planning', checked: false },
    { category: 'On the Day', item: 'Photo list for photographer', checked: false },
    { category: 'On the Day', item: 'Emergency kit (sewing kit, pain relief, etc.)', checked: false },
    { category: 'Preparation', subcategory: 'Bride', item: 'Dress fittings (3 sessions)', checked: false },
    { category: 'Preparation', subcategory: 'Bride', item: 'Hair and makeup trial', checked: false },
    { category: 'Preparation', subcategory: 'Bride', item: 'Something old, new, borrowed, blue', checked: false },
    { category: 'Preparation', subcategory: 'Bride', item: 'Bridal party gifts', checked: false },
    { category: 'Preparation', subcategory: 'Groom', item: 'Suit fitting', checked: false },
    { category: 'Preparation', subcategory: 'Groom', item: 'Grooming appointment', checked: false },
    { category: 'Preparation', subcategory: 'Groom', item: 'Groomsmen gifts', checked: false },
    { category: 'Preparation', subcategory: 'Groom', item: 'Ring bearer briefing', checked: false },
    { category: 'Preparation', subcategory: 'Together', item: 'Cake tasting', checked: false },
    { category: 'Preparation', subcategory: 'Together', item: 'Menu tasting', checked: false },
    { category: 'Preparation', subcategory: 'Together', item: 'Venue walkthrough', checked: false },
    { category: 'Preparation', subcategory: 'Together', item: 'Seating chart', checked: false },
    { category: 'Preparation', subcategory: 'Together', item: 'Vow writing session', checked: false },
    { category: 'Photographer', item: 'Research photographer styles', checked: false },
    { category: 'Photographer', item: 'Book engagement shoot', checked: false },
    { category: 'Photographer', item: 'Create shot list for ceremony', checked: false },
    { category: 'Photographer', item: 'Create shot list for reception', checked: false },
    { category: 'Photographer', item: 'Golden hour couple portraits', checked: false },
    { category: 'Photographer', item: 'Family group photo list', checked: false },
    { category: 'Prices', item: 'Get quotes from 3 photographers', checked: false },
    { category: 'Prices', item: 'Compare videographer packages', checked: false },
    { category: 'Prices', item: 'Venue cost breakdown', checked: false },
    { category: 'Prices', item: 'Catering per-head pricing', checked: false },
    { category: 'Prices', item: 'Florist estimates', checked: false },
    { category: 'Prices', item: 'DJ vs live band pricing', checked: false },
  ]);

  // ── Wedding Budget ──
  await seedIfEmpty('wedding_budget', [
    { category: 'Photographer - Basic', estimated: 2000, actual: 0, notes: '4 hours coverage' },
    { category: 'Photographer - Standard', estimated: 3500, actual: 0, notes: '8 hours + engagement shoot' },
    { category: 'Photographer - Premium', estimated: 5000, actual: 0, notes: 'Full day + album' },
    { category: 'Venue', estimated: 0, actual: 0, notes: 'TBD' },
    { category: 'Catering', estimated: 0, actual: 0, notes: 'TBD' },
    { category: 'Flowers', estimated: 0, actual: 0, notes: 'TBD' },
    { category: 'Music/DJ', estimated: 0, actual: 0, notes: 'TBD' },
    { category: 'Dress & Suit', estimated: 0, actual: 0, notes: '' },
  ]);

  // ── Travel Locations ──
  await seedIfEmpty('travel_locations', [
    { name: 'New York City', country: 'United States', region: 'America', status: 'future_both' },
    { name: 'Seoul', country: 'South Korea', region: 'Asia', status: 'future_both' },
    { name: 'Busan', country: 'South Korea', region: 'Asia', status: 'future_both' },
    { name: 'Tokyo', country: 'Japan', region: 'Asia', status: 'future_both' },
    { name: 'Osaka', country: 'Japan', region: 'Asia', status: 'future_both' },
    { name: 'Kyoto', country: 'Japan', region: 'Asia', status: 'future_both' },
    { name: 'Helsinki', country: 'Finland', region: 'Europe', status: 'future_both' },
    { name: 'Rovaniemi', country: 'Finland', region: 'Europe', status: 'future_both' },
    { name: 'Zurich', country: 'Switzerland', region: 'Europe', status: 'future_both' },
    { name: 'Interlaken', country: 'Switzerland', region: 'Europe', status: 'future_both' },
    { name: 'Paris', country: 'France', region: 'Europe', status: 'future_both' },
    { name: 'Santorini', country: 'Greece', region: 'Europe', status: 'future_both' },
    { name: 'London', country: 'United Kingdom', region: 'Europe', status: 'future_both' },
    { name: 'Barcelona', country: 'Spain', region: 'Europe', status: 'future_both' },
    { name: 'Bangkok', country: 'Thailand', region: 'Asia', status: 'future_both' },
    { name: 'Bali', country: 'Indonesia', region: 'Asia', status: 'future_both' },
    { name: 'Atlanta', country: 'United States', region: 'America', status: 'future_both' },
  ]);

  console.log('\n🎉 Done!');
}

main().catch(console.error);
