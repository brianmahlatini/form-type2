import React, { useId, useRef, useState } from 'react'

const WEBHOOK_URL = 'https://kgadev.app.n8n.cloud/webhook-test/claim-submission'

type CauseOfDeath = 'Natural' | 'Stillborn' | 'Under Investigation' | 'Un-natural'
type DeathCertificateCopyType = '' | 'Original' | 'Certified Copy'

type FormState = {
  mainMemberIdNumber: string
  policyNumber: string

  deceasedIdNumber: string
  causeOfDeath: CauseOfDeath | ''
  dateOfDeath: string

  claimAmountRequested: string

  contactEmail: string

  beneficiaryFirstName: string
  beneficiarySurname: string
  beneficiaryIdNumber: string
  beneficiaryAccountNumber: string
  bankName: string
  accountType: '' | 'Savings' | 'Current' | 'Cheque'

  deathCertificateFile: File | null
  deathCertificateCopyType: DeathCertificateCopyType
  deceasedCertifiedIdFile: File | null
  claimantCertifiedIdFile: File | null
  completedClaimFormFile: File | null
}

const bankNames = [
  'ABN AMRO BANK',
  'ABSA',
  'ALBARAKA BANK',
  'BANK OF ATHENS',
  'CAPITEC BANK',
  'CITIBANK',
  'FNB',
  'INVESTEC',
  'NBS',
  'NEDBANK (CHQ ACCOUNT ONLY)',
  'NEDBANK (SAVINGS ACCOUNT ONLY)',
  'PEP BANK',
  'STANDARD BANK',
  'STATE BANK OF INDIA',
  'TYMEBANK OF TYMEBANK LTD',
  'BANK ZERO',
  'BNP PARIBAS SA',
  'DISCOVERY BANK LTD',
  'FINBOND MUTUAL BANK',
  'HSBC BANK',
  'J.P.MORGAN CHASE BANK',
  'SASFIN BANK LIMITED',
  'SOCIETE GENERALE BANK',
] as const

const initialState: FormState = {
  mainMemberIdNumber: '',
  policyNumber: '',

  deceasedIdNumber: '',
  causeOfDeath: '',
  dateOfDeath: '',

  claimAmountRequested: '',

  contactEmail: '',

  beneficiaryFirstName: '',
  beneficiarySurname: '',
  beneficiaryIdNumber: '',
  beneficiaryAccountNumber: '',
  bankName: '',
  accountType: '',

  deathCertificateFile: null,
  deathCertificateCopyType: '',
  deceasedCertifiedIdFile: null,
  claimantCertifiedIdFile: null,
  completedClaimFormFile: null,
}

type SubmitState =
  | { type: 'idle' }
  | { type: 'submitting' }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string }

type DocumentPayload = {
  documentType:
    | 'DEATH_CERTIFICATE'
    | 'DECEASED_CERTIFIED_ID'
    | 'CLAIMANT_CERTIFIED_ID'
    | 'COMPLETED_CLAIM_FORM'
  filename: string
  contentType: string
  size: number
  copyType?: Exclude<DeathCertificateCopyType, ''>
}

type SubmissionResult = {
  claimType: 'Death Claim'
  policyType: 'Life'
  mainMemberIdNumber: string
  policyNumber: string
  deceasedIdNumber: string
  causeOfDeath: FormState['causeOfDeath']
  dateOfDeath: string
  claimAmountRequested: string
  contactEmail: string
  beneficiaryFirstName: string
  beneficiarySurname: string
  beneficiaryIdNumber: string
  beneficiaryAccountNumber: string
  bankName: string
  accountType: FormState['accountType']
  documents: DocumentPayload[]
  submittedAt: string
  userAgent: string
  clientTimeZone: string
}

async function toFormData(state: FormState) {
  const formData = new FormData()

  formData.set('claimType', 'Death Claim')
  formData.set('policyType', 'Life')
  formData.set('mainMemberIdNumber', state.mainMemberIdNumber)
  formData.set('policyNumber', state.policyNumber)
  formData.set('deceasedIdNumber', state.deceasedIdNumber)
  formData.set('causeOfDeath', state.causeOfDeath)
  formData.set('dateOfDeath', state.dateOfDeath)

  formData.set('claimAmountRequested', state.claimAmountRequested)
  formData.set('contactEmail', state.contactEmail)

  formData.set('beneficiaryFirstName', state.beneficiaryFirstName)
  formData.set('beneficiarySurname', state.beneficiarySurname)
  formData.set('beneficiaryIdNumber', state.beneficiaryIdNumber)
  formData.set('beneficiaryAccountNumber', state.beneficiaryAccountNumber)
  formData.set('bankName', state.bankName)
  formData.set('accountType', state.accountType)

  const documentsPayload: DocumentPayload[] = []

  const documentEntries: Array<{
    documentType: DocumentPayload['documentType']
    file: File | null
    copyType?: Exclude<DeathCertificateCopyType, ''>
  }> = [
    {
      documentType: 'DEATH_CERTIFICATE',
      file: state.deathCertificateFile,
      copyType: state.deathCertificateCopyType || undefined,
    },
    { documentType: 'DECEASED_CERTIFIED_ID', file: state.deceasedCertifiedIdFile },
    { documentType: 'CLAIMANT_CERTIFIED_ID', file: state.claimantCertifiedIdFile },
    { documentType: 'COMPLETED_CLAIM_FORM', file: state.completedClaimFormFile },
  ]

  for (const entry of documentEntries) {
    if (!entry.file) continue

    documentsPayload.push({
      documentType: entry.documentType,
      filename: entry.file.name,
      contentType: entry.file.type || 'application/octet-stream',
      size: entry.file.size,
      ...(entry.copyType ? { copyType: entry.copyType } : {}),
    })

    formData.append('documentFiles', entry.file, entry.file.name)
    formData.append('documentFileTypes', entry.documentType)
  }

  formData.set('documents', JSON.stringify(documentsPayload))
  formData.set('documentsCount', String(documentsPayload.length))

  const submittedAt = new Date().toISOString()
  const userAgent = navigator.userAgent
  const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  formData.set('submittedAt', submittedAt)
  formData.set('userAgent', userAgent)
  formData.set('clientTimeZone', clientTimeZone)

  const result: SubmissionResult = {
    claimType: 'Death Claim',
    policyType: 'Life',
    mainMemberIdNumber: state.mainMemberIdNumber,
    policyNumber: state.policyNumber,
    deceasedIdNumber: state.deceasedIdNumber,
    causeOfDeath: state.causeOfDeath,
    dateOfDeath: state.dateOfDeath,
    claimAmountRequested: state.claimAmountRequested,
    contactEmail: state.contactEmail,
    beneficiaryFirstName: state.beneficiaryFirstName,
    beneficiarySurname: state.beneficiarySurname,
    beneficiaryIdNumber: state.beneficiaryIdNumber,
    beneficiaryAccountNumber: state.beneficiaryAccountNumber,
    bankName: state.bankName,
    accountType: state.accountType,
    documents: documentsPayload,
    submittedAt,
    userAgent,
    clientTimeZone,
  }

  formData.set('results', JSON.stringify([result]))

  return formData
}

function fileFromInput(e: React.ChangeEvent<HTMLInputElement>) {
  return e.currentTarget.files?.[0] ?? null
}

export function App() {
  const [state, setState] = useState<FormState>(initialState)
  const [submitState, setSubmitState] = useState<SubmitState>({ type: 'idle' })

  const statusRegionId = useId()
  const deathCertificateInputId = useId()
  const deceasedCertifiedIdInputId = useId()
  const claimantCertifiedIdInputId = useId()
  const completedClaimFormInputId = useId()
  const dateOfDeathRef = useRef<HTMLInputElement | null>(null)

  function onChangeText(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.currentTarget
    setState((prev) => ({ ...prev, [name]: value }))
  }

  function onChangeSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const { name, value } = e.currentTarget
    setState((prev) => ({ ...prev, [name]: value }))
  }

  function openDatePicker() {
    const input = dateOfDeathRef.current as HTMLInputElement & { showPicker?: () => void }
    input?.showPicker?.()
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    setSubmitState({ type: 'submitting' })
    try {
      const body = await toFormData(state)
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        body,
      })

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(text || `Request failed (${response.status})`)
      }

      setSubmitState({ type: 'success', message: 'Submitted successfully.' })
      setState(initialState)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setSubmitState({
        type: 'error',
        message: `Submission failed. ${message}`.slice(0, 320),
      })
    }
  }

  return (
    <div className="page">
      <div className="bgGlow" aria-hidden="true" />
      <main className="container">
        <header className="header">
          <div className="brandMark" aria-hidden="true" />
          <div>
            <h1 className="title">CLAIM ASSESSMENT FORM</h1>
          </div>
        </header>

        <section className="card" aria-label="Claim form">
          <form onSubmit={onSubmit} className="form" noValidate>
            {submitState.type === 'error' ? (
              <div className="alert alertError" role="alert">
                <div className="alertTitle">Submission failed</div>
                <div className="alertBody">{submitState.message}</div>
              </div>
            ) : null}

            {submitState.type === 'success' ? (
              <div className="alert alertSuccess" role="status" aria-live="polite">
                <div className="alertTitle">Done</div>
                <div className="alertBody">{submitState.message}</div>
              </div>
            ) : null}

            <div className="section">
              <h2 className="sectionTitle">Member & policy</h2>
              <div className="grid2">
                <Field
                  label="Main member ID number"
                  name="mainMemberIdNumber"
                  value={state.mainMemberIdNumber}
                  onChange={onChangeText}
                  inputMode="numeric"
                  autoComplete="off"
                />
                <Field
                  label="Policy number"
                  name="policyNumber"
                  value={state.policyNumber}
                  onChange={onChangeText}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="section">
              <h2 className="sectionTitle">Deceased details</h2>
              <div className="grid2">
                <Field
                  label="Deceased ID number"
                  name="deceasedIdNumber"
                  value={state.deceasedIdNumber}
                  onChange={onChangeText}
                  inputMode="numeric"
                  autoComplete="off"
                />
                <div className="field">
                  <div className="labelRow">
                    <label className="label" htmlFor="causeOfDeath">
                      Cause of death
                    </label>
                  </div>
                  <select
                    id="causeOfDeath"
                    name="causeOfDeath"
                    className="input"
                    value={state.causeOfDeath}
                    onChange={onChangeSelect}
                  >
                    <option value="">Please select</option>
                    {(['Natural', 'Stillborn', 'Under Investigation', 'Un-natural'] as const).map(
                      (option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>

              <div className="grid2">
                <div className="field">
                  <div className="labelRow">
                    <label className="label" htmlFor="dateOfDeath">
                      Date of death
                    </label>
                  </div>
                  <div className="dateRow">
                    <input
                      id="dateOfDeath"
                      name="dateOfDeath"
                      type="date"
                      className="input"
                      ref={dateOfDeathRef}
                      value={state.dateOfDeath}
                      onChange={onChangeText}
                      readOnly
                      onKeyDown={(e) => e.preventDefault()}
                    />
                    <button
                      type="button"
                      className="pickerBtn"
                      onClick={openDatePicker}
                      aria-label="Open calendar"
                      title="Open calendar"
                    >
                      <svg
                        className="pickerIcon"
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        aria-hidden="true"
                      >
                        <path
                          fill="currentColor"
                          d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1.5A2.5 2.5 0 0 1 22 6.5v13A2.5 2.5 0 0 1 19.5 22h-15A2.5 2.5 0 0 1 2 19.5v-13A2.5 2.5 0 0 1 4.5 4H6V3a1 1 0 0 1 1-1Zm12.5 8h-15a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h15a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5ZM6 6H4.5a.5.5 0 0 0-.5.5V8h16V6.5a.5.5 0 0 0-.5-.5H18v1a1 1 0 1 1-2 0V6H8v1a1 1 0 1 1-2 0V6Z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="field" />
              </div>
            </div>

            <div className="section">
              <h2 className="sectionTitle">Claim amount</h2>
              <div className="grid2">
                <div className="field">
                  <div className="labelRow">
                    <label className="label" htmlFor="claimAmountRequested">
                      Amount requested
                    </label>
                  </div>
                  <div className="moneyRow">
                    <span className="moneyPrefix" aria-hidden="true">
                      R
                    </span>
                    <input
                      id="claimAmountRequested"
                      name="claimAmountRequested"
                      type="text"
                      className="input moneyInput"
                      value={state.claimAmountRequested}
                      onChange={onChangeText}
                      inputMode="decimal"
                      autoComplete="off"
                    />
                  </div>
                </div>
                <div className="field" />
              </div>
            </div>

            <div className="section">
              <h2 className="sectionTitle">Contact details</h2>
              <div className="grid2">
                <Field
                  label="Your email"
                  name="contactEmail"
                  value={state.contactEmail}
                  onChange={onChangeText}
                  type="email"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="section">
              <h2 className="sectionTitle">Beneficiary details</h2>
              <div className="grid2">
                <Field
                  label="First name"
                  name="beneficiaryFirstName"
                  value={state.beneficiaryFirstName}
                  onChange={onChangeText}
                  autoComplete="given-name"
                />
                <Field
                  label="Surname"
                  name="beneficiarySurname"
                  value={state.beneficiarySurname}
                  onChange={onChangeText}
                  autoComplete="family-name"
                />
              </div>

              <div className="grid2">
                <Field
                  label="ID number"
                  name="beneficiaryIdNumber"
                  value={state.beneficiaryIdNumber}
                  onChange={onChangeText}
                  inputMode="numeric"
                  autoComplete="off"
                />
                <Field
                  label="Account no"
                  name="beneficiaryAccountNumber"
                  value={state.beneficiaryAccountNumber}
                  onChange={onChangeText}
                  inputMode="numeric"
                  autoComplete="off"
                />
              </div>

              <div className="grid2">
                <div className="field">
                  <div className="labelRow">
                    <label className="label" htmlFor="bankName">
                      Bank name
                    </label>
                  </div>
                  <select
                    id="bankName"
                    name="bankName"
                    className="input"
                    value={state.bankName}
                    onChange={onChangeSelect}
                  >
                    <option value="">Please select</option>
                    {bankNames.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <div className="labelRow">
                    <label className="label" htmlFor="accountType">
                      Account type
                    </label>
                  </div>
                  <select
                    id="accountType"
                    name="accountType"
                    className="input"
                    value={state.accountType}
                    onChange={onChangeSelect}
                  >
                    <option value="">Please select</option>
                    <option value="Savings">Savings</option>
                    <option value="Current">Current</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="section">
              <h2 className="sectionTitle">Documents (Upload each separately)</h2>

              <div className="docCards">
                <div className="docCard">
                  <div className="docCardHeader">
                    <div className="docCardTitle">1. DEATH CERTIFICATE</div>
                  </div>
                  <div className="docCardBody">
                    <input
                      id={deathCertificateInputId}
                      type="file"
                      className="file"
                      accept="application/pdf,image/*"
                      onChange={(e) =>
                        setState((prev) => ({ ...prev, deathCertificateFile: fileFromInput(e) }))
                      }
                    />
                    <div className="docInlineRadios" role="group" aria-label="Death certificate type">
                      {(['Original', 'Certified Copy'] as const).map((option) => (
                        <label key={option} className="docRadio">
                          <input
                            type="radio"
                            name="deathCertificateCopyType"
                            value={option}
                            checked={state.deathCertificateCopyType === option}
                            onChange={() =>
                              setState((prev) => ({ ...prev, deathCertificateCopyType: option }))
                            }
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                    <div className="docNote">Note: Original death certificate is required</div>
                  </div>
                </div>

                <div className="docCard">
                  <div className="docCardHeader">
                    <div className="docCardTitle">2. CERTIFIED ID OF DECEASED</div>
                  </div>
                  <div className="docCardBody">
                    <input
                      id={deceasedCertifiedIdInputId}
                      type="file"
                      className="file"
                      accept="application/pdf,image/*"
                      onChange={(e) =>
                        setState((prev) => ({ ...prev, deceasedCertifiedIdFile: fileFromInput(e) }))
                      }
                    />
                  </div>
                </div>

                <div className="docCard">
                  <div className="docCardHeader">
                    <div className="docCardTitle">3. CERTIFIED ID OF CLAIMANT</div>
                  </div>
                  <div className="docCardBody">
                    <input
                      id={claimantCertifiedIdInputId}
                      type="file"
                      className="file"
                      accept="application/pdf,image/*"
                      onChange={(e) =>
                        setState((prev) => ({ ...prev, claimantCertifiedIdFile: fileFromInput(e) }))
                      }
                    />
                  </div>
                </div>

                <div className="docCard">
                  <div className="docCardHeader">
                    <div className="docCardTitle">4. COMPLETED CLAIM FORM</div>
                  </div>
                  <div className="docCardBody">
                    <input
                      id={completedClaimFormInputId}
                      type="file"
                      className="file"
                      accept="application/pdf,image/*"
                      onChange={(e) =>
                        setState((prev) => ({ ...prev, completedClaimFormFile: fileFromInput(e) }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="actions">
              <button
                className="primaryBtn"
                type="submit"
                disabled={submitState.type === 'submitting'}
              >
                {submitState.type === 'submitting' ? 'Submitting...' : 'Submit claim'}
              </button>
              <button
                className="secondaryBtn"
                type="button"
                onClick={() => {
                  setState(initialState)
                  setSubmitState({ type: 'idle' })
                }}
                disabled={submitState.type === 'submitting'}
              >
                Clear
              </button>

              <div id={statusRegionId} className="srOnly" aria-live="polite">
                {submitState.type === 'submitting' ? 'Submitting' : ''}
              </div>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}

type FieldProps = {
  label: React.ReactNode
  name: keyof FormState
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: React.HTMLInputTypeAttribute
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  autoComplete?: string
}

function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  inputMode,
  autoComplete,
}: FieldProps) {
  const id = useId()

  return (
    <div className="field">
      <div className="labelRow">
        <label className="label" htmlFor={id}>
          {label}
        </label>
      </div>
      <input
        id={id}
        className="input"
        name={name}
        value={value}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        onChange={onChange}
      />
    </div>
  )
}
