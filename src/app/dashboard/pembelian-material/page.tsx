import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <p>Ini halaman pembelian material</p>
      <Button variant="secondary" asChild>
        <Link href="/dashboard/pembelian-material/add">
          Tambah Material Masuk
        </Link>
      </Button>
    </div>
  );
}
