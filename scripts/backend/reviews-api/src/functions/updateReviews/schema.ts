
export default {
  type: "object",
  properties: {
    body: {
      type: "object",
      properties: {
        ids: {
          type: "array",
          items: {
            type: "string"
          },
        }
      },
      required: ['ids']
    }
  }
} as const;


