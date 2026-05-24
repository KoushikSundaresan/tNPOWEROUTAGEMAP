import { getOutageData } from '../lib/db';
import Dashboard from '../components/Dashboard';

export default async function Home() {
  const data = await getOutageData();

  return (
    <main>
      <Dashboard data={data} />
    </main>
  );
}
