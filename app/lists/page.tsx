'use client';

import Layout from '@/components/Layout';
import dynamic from 'next/dynamic';

const BucketListPage = dynamic(() => import('../bucketlist/page'), { ssr: false });

export default function ListsPage() {
  return (
    <Layout>
      <BucketListPage />
    </Layout>
  );
}
