import sdk from "../../../sdk"
import { CreateViewRequest, Ctx, ViewResponse } from "@budibase/types"

export async function create(ctx: Ctx<CreateViewRequest, ViewResponse>) {
  const view = ctx.request.body
  const { tableId } = view

  const result = await sdk.views.create(tableId, view)
  ctx.status = 201
  ctx.body = {
    data: result,
  }
}

export async function remove(ctx: Ctx) {
  const { viewId } = ctx.params

  await sdk.views.remove(viewId)
  ctx.status = 204
}
