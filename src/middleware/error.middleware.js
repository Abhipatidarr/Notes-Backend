export const errorHandler = async (c, next) => {
  try {
    await next()
  } catch (error) {
    console.error(error)

    return c.json({
      message: "Internal Server Error"
    }, 500)
  }
}