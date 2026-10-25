import { describe, expect, it } from 'vitest';
import { BillOfMaterials, WorkOrder } from './models/ErpModels';

describe('Production planning models', () => {
  it('accepts a revisioned BOM with component quantities', async () => {
    const bom = new BillOfMaterials({
      bomNumber: 'BOM-00001',
      productId: 'finished-product',
      productName: 'Finished Assembly',
      revision: 'A',
      components: [
        {
          productId: 'raw-material',
          quantity: 2,
          scrapPercent: 3,
          uom: 'Nos',
          level: 1,
        },
      ],
      organisationId: 'org-1',
      branchId: 'branch-1',
    });

    await expect(bom.validate()).resolves.toBeUndefined();
  });

  it('rejects invalid work-order quantities', async () => {
    const workOrder = new WorkOrder({
      workOrderNumber: 'WO-00001',
      productId: 'finished-product',
      productName: 'Finished Assembly',
      bomId: 'bom-1',
      bomRevision: 'A',
      plannedQuantity: 0,
      plannedStartDate: '2026-10-25',
      plannedEndDate: '2026-10-26',
      materials: [],
      organisationId: 'org-1',
      branchId: 'branch-1',
      financialYear: '2026-2027',
    });

    await expect(workOrder.validate()).rejects.toThrow(/plannedQuantity/);
  });
});
