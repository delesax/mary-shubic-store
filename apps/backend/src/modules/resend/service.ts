import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import type {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"
import { Resend } from "resend"
import { renderOrderPlacedEmail, type RenderedEmail } from "./emails/order-placed"

type ResendOptions = {
  api_key: string
  from: string
}

type InjectedDependencies = {
  logger: Logger
}

export enum Templates {
  ORDER_PLACED = "order-placed",
}

// One renderer per template name. Add new emails here
// (e.g. shipment-created, password-reset) as you build them.
const templates: Partial<Record<Templates, (props: any) => RenderedEmail>> = {
  [Templates.ORDER_PLACED]: renderOrderPlacedEmail,
}

function subjectFor(template: Templates, data: any): string {
  switch (template) {
    case Templates.ORDER_PLACED: {
      const displayId = data?.order?.display_id
      return displayId
        ? `Your Mary Shubic order #${displayId}`
        : "Your Mary Shubic order"
    }
    default:
      return "Mary Shubic"
  }
}

class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "notification-resend"

  private resendClient: Resend
  private options: ResendOptions
  private logger: Logger

  constructor({ logger }: InjectedDependencies, options: ResendOptions) {
    super()
    this.resendClient = new Resend(options.api_key)
    this.options = options
    this.logger = logger
  }

  static validateOptions(options: Record<any, any>) {
    if (!options.api_key) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option `api_key` is required in the Resend provider's options."
      )
    }
    if (!options.from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option `from` is required in the Resend provider's options."
      )
    }
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const templateName = notification.template as Templates
    const render = templates[templateName]

    if (!render) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `No email template found for "${notification.template}". Valid templates: ${Object.values(Templates).join(", ")}`
      )
    }

    const { html, text } = render(notification.data)

    const { data, error } = await this.resendClient.emails.send({
      from: this.options.from,
      to: [notification.to],
      subject: subjectFor(templateName, notification.data),
      html,
      text,
    })

    if (error || !data) {
      const reason = error?.message ?? "unknown error"
      this.logger.error(`Resend failed to send "${templateName}" email: ${reason}`)
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Resend failed to send email: ${reason}`
      )
    }

    return { id: data.id }
  }
}

export default ResendNotificationProviderService