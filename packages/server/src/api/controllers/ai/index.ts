import { BadRequestError } from "@budibase/backend-core"
import { Ctx } from "@budibase/types"
import fetch from "node-fetch"
import fs from "fs"
import FormData from "form-data"

export async function parseReceipt(ctx: Ctx): Promise<any> {
  const file = ctx.request?.files?.file
  if (!file) {
    throw new BadRequestError("No file provided")
  }

  if (Array.isArray(file)) {
    throw new BadRequestError("Only one file can be uploaded")
  }

  const text = await ocr(file.path)

  const resp = await prompt(`
    I have extracted the following text from a receipt. 

    "${text}"

    I would like to extract the following information from the receipt:

    - company_name
    - company_address
    - company_postcode
    - total_cost
    - date_of_expense
    - category

    Where "category" is one of: "travel", "meals", "accommodation", "equipment", "miscellaneous".

    Please provide your response as a single JSON object with the keys above.
  `)

  let json = extractJSON(resp)
  console.log(`Parsed JSON: ${JSON.stringify(json)}`)

  if (!json) {
    json = {
      company_name: null,
      company_address: null,
      company_postcode: null,
      total_cost: null,
      date_of_expense: null,
      category: null,
    }
  }

  ctx.body = json
}

async function ocr(path: string): Promise<string> {
  const form = new FormData()
  form.append("file", fs.createReadStream(path))
  const resp = await fetch("http://localhost:11343/ocr", {
    method: "POST",
    body: form,
  })
  const json = await resp.json()
  console.log(`Extracted text: ${JSON.stringify(json)}`)
  return json.text
}

async function prompt(text: string): Promise<string> {
  const resp = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    body: JSON.stringify({
      model: "llama3",
      messages: [
        {
          role: "user",
          content: text,
        },
      ],
      stream: false,
    }),
    headers: { "Content-Type": "application/json" },
  })
  const out = await resp.json()
  console.log(`Prompt response: ${JSON.stringify(out)}`)
  return out.message.content
}

function extractJSON(text: string): any {
  const regex = /{[^{}]*(?:{[^{}]*}[^{}]*)*}/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    try {
      const jsonObject = JSON.parse(match[0])
      return jsonObject
    } catch (e) {
      console.error("Failed to parse JSON:", e)
    }
  }

  return null
}
