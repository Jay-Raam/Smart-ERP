import DataLoader from 'dataloader';
import { PoolClient } from 'pg';

export function createDataLoaders(pgClient?: PoolClient, mockStore?: any) {
  return {
    // Batch loader for Invoices by Project IDs (Eliminating N+1 queries)
    invoicesByProjectId: new DataLoader<string, any[]>(async (projectIds) => {
      if (pgClient) {
        try {
          const query = `
            SELECT * FROM invoices 
            WHERE project_id = ANY($1::uuid[])
            ORDER BY created_at DESC
          `;
          const { rows } = await pgClient.query(query, [projectIds]);

          const invoiceMap = new Map<string, any[]>();
          projectIds.forEach((id) => invoiceMap.set(id, []));
          rows.forEach((inv) => {
            const list = invoiceMap.get(inv.project_id) || [];
            list.push({
              id: inv.id,
              invoiceNumber: inv.invoice_number,
              subtotal: parseFloat(inv.subtotal),
              taxRate: parseFloat(inv.tax_rate),
              totalAmount: parseFloat(inv.total_amount),
              status: inv.status,
              dueDate: inv.due_date,
              issuedDate: inv.issued_date,
              projectId: inv.project_id,
            });
            invoiceMap.set(inv.project_id, list);
          });

          return projectIds.map((id) => invoiceMap.get(id) || []);
        } catch (err) {
          // Fall back to mockStore
        }
      }

      // Mock store loader
      return projectIds.map((id) => {
        return (mockStore?.invoices || []).filter((inv: any) => inv.projectId === id);
      });
    }),

    // Batch loader for Project by Project ID
    projectLoader: new DataLoader<string, any>(async (projectIds) => {
      if (pgClient) {
        try {
          const query = `SELECT * FROM projects WHERE id = ANY($1::uuid[])`;
          const { rows } = await pgClient.query(query, [projectIds]);
          const projectMap = new Map(
            rows.map((p) => [
              p.id,
              {
                id: p.id,
                name: p.name,
                code: p.code,
                budget: parseFloat(p.budget),
                status: p.status,
                createdAt: p.created_at,
              },
            ])
          );
          return projectIds.map((id) => projectMap.get(id) || null);
        } catch (err) {
          // Fall back to mockStore
        }
      }

      // Mock store loader
      return projectIds.map((id) => {
        return (mockStore?.projects || []).find((p: any) => p.id === id) || null;
      });
    }),
  };
}
