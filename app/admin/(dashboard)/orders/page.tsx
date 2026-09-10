import { AdminOrderList } from "@/components/AdminOrderList";
import {
  countAdminProgressOrders,
  listOrdersForAdmin,
  type OrderListTab,
} from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { productImages } from "@/lib/product-images";

type PageProps = {
  searchParams: Promise<{
    tab?: string;
    accepted?: string;
    rejected?: string;
    rejectError?: string;
    order?: string;
  }>;
};

function parseTab(raw: string | undefined): OrderListTab {
  if (raw === "completed") return "completed";
  if (raw === "cancel" || raw === "cancelled") return "cancel";
  return "progress";
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab = parseTab(params.tab);

  const [orders, progressCount] = await Promise.all([
    listOrdersForAdmin(tab),
    countAdminProgressOrders(),
  ]);

  const productIds = [
    ...new Set(orders.flatMap((o) => o.items.map((i) => i.productId))),
  ];
  const products =
    productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, imageUrl: true, imageUrls: true },
        })
      : [];
  const imageByProduct = new Map(
    products.map((p) => [p.id, productImages(p)[0] ?? null])
  );

  let notice: string | null = null;
  let noticeTone: "ok" | "error" = "ok";
  if (params.rejectError) {
    notice = "Isi alasan";
    noticeTone = "error";
  } else if (params.accepted) {
    notice = "Diterima";
  } else if (params.rejected) {
    notice = "Ditolak";
  }

  return (
    <AdminOrderList
      orders={orders}
      activeTab={tab}
      progressCount={progressCount}
      imageByProduct={imageByProduct}
      notice={notice}
      noticeTone={noticeTone}
      rejectFocusOrderId={params.order ?? null}
    />
  );
}
