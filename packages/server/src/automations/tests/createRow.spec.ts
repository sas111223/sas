import * as setup from "./utilities"
import { objectStoreTestProviders } from "@budibase/backend-core/tests"
import { objectStore } from "@budibase/backend-core"
import tk from "timekeeper"
import { basicTableWithAttachmentField } from "../../tests/utilities/structures"

describe("test the create row action", () => {
  let table: any
  let row: any
  let config = setup.getConfig()

  beforeEach(async () => {
    await config.init()
    table = await config.createTable()
    row = {
      tableId: table._id,
      name: "test",
      description: "test",
    }
  })

  beforeAll(async () => {
    tk.reset()
    await objectStoreTestProviders.minio.start()
  })

  afterAll(async () => {
    await objectStoreTestProviders.minio.stop()
    await setup.afterAll()
  })

  afterAll(setup.afterAll)

  it("should be able to run the action", async () => {
    const res = await setup.runStep(setup.actions.CREATE_ROW.stepId, {
      row,
    })
    expect(res.id).toBeDefined()
    expect(res.revision).toBeDefined()
    expect(res.success).toEqual(true)
    const gottenRow = await config.api.row.get(table._id, res.id)
    expect(gottenRow.name).toEqual("test")
    expect(gottenRow.description).toEqual("test")
  })

  it("should return an error (not throw) when bad info provided", async () => {
    const res = await setup.runStep(setup.actions.CREATE_ROW.stepId, {
      row: {
        tableId: "invalid",
        invalid: "invalid",
      },
    })
    expect(res.success).toEqual(false)
  })

  it("should check invalid inputs return an error", async () => {
    const res = await setup.runStep(setup.actions.CREATE_ROW.stepId, {})
    expect(res.success).toEqual(false)
  })

  it("should check that an attachment field is sent to storage and parsed", async () => {
    jest.unmock("aws-sdk")
    let attachmentTable = await config.createTable(
      basicTableWithAttachmentField()
    )

    let attachmentRow: any = {
      tableId: attachmentTable._id,
    }

    let bucket = "testbucket"
    let filename = "test.txt"
    await objectStore.upload({
      bucket,
      filename,
      body: Buffer.from("test data"),
    })
    let presignedUrl = await objectStore.getPresignedUrl(
      bucket,
      filename,
      60000
    )
    let attachmentObject = [
      {
        url: presignedUrl,
        filename,
      },
    ]

    attachmentRow.file_attachment = attachmentObject
    const res = await setup.runStep(setup.actions.CREATE_ROW.stepId, {
      row: attachmentRow,
    })
    expect(res.success).toEqual(true)
  })
})
