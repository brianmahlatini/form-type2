import React, { useId, useMemo, useState } from 'react'

const WEBHOOK_URL =
  'https://kgadev.app.n8n.cloud/webhook-test/4e55e486-8f0b-4f0e-8ee6-365f2c34e66f'

type CauseOfDeath = 'Natural' | 'Stillborn' | 'Under Investigation' | 'Un-natural'

type FormState = {
  mainMemberIdNumber: string
  policyNumber: string

  deceasedIdNumber: string
  causeOfDeath: CauseOfDeath | ''

  beneficiaryFirstName: string
  beneficiarySurname: string
  beneficiaryIdNumber: string
  beneficiaryAccountNumber: string
  bankName: string
  accountType: '' | 'Savings' | 'Current' | 'Cheque'

  contactEmail: string
  dateOfDeath: string
  documents: File[]
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

  beneficiaryFirstName: '',
  beneficiarySurname: '',
  beneficiaryIdNumber: '',
  beneficiaryAccountNumber: '',
  bankName: '',
  accountType: '',

  contactEmail: '',
  dateOfDeath: '',
  documents: [],
}

type SubmitState =
  | { type: 'idle' }
  | { type: 'submitting' }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string }

function toFormData(state: FormState) {
  const formData = new FormData()

  formData.set('mainMemberIdNumber', state.mainMemberIdNumber)
  formData.set('policyNumber', state.policyNumber)
  formData.set('deceasedIdNumber', state.deceasedIdNumber)
  formData.set('causeOfDeath', state.causeOfDeath)

  formData.set('beneficiaryFirstName', state.beneficiaryFirstName)
  formData.set('beneficiarySurname', state.beneficiarySurname)
  formData.set('beneficiaryIdNumber', state.beneficiaryIdNumber)
  formData.set('beneficiaryAccountNumber', state.beneficiaryAccountNumber)
  formData.set('bankName', state.bankName)
  formData.set('accountType', state.accountType)

  formData.set('contactEmail', state.contactEmail)
  formData.set('dateOfDeath', state.dateOfDeath)

  for (const file of state.documents) {
    formData.append('documents', file, file.name)
  }

  formData.set('submittedAt', new Date().toISOString())
  formData.set('userAgent', navigator.userAgent)
  formData.set('clientTimeZone', Intl.DateTimeFormat().resolvedOptions().timeZone)

  return formData
}

function validate(state: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {}

  if (!state.mainMemberIdNumber.trim())
    errors.mainMemberIdNumber = 'Enter the main member ID number.'
  if (!state.policyNumber.trim()) errors.policyNumber = 'Enter the policy number.'

  if (!state.deceasedIdNumber.trim()) errors.deceasedIdNumber = 'Enter the deceased ID number.'
  if (!state.causeOfDeath) errors.causeOfDeath = 'Select a cause of death.'

  if (!state.beneficiaryFirstName.trim())
    errors.beneficiaryFirstName = 'Enter the beneficiary first name.'
  if (!state.beneficiarySurname.trim())
    errors.beneficiarySurname = 'Enter the beneficiary surname.'
  if (!state.beneficiaryIdNumber.trim())
    errors.beneficiaryIdNumber = 'Enter the beneficiary ID number.'
  if (!state.beneficiaryAccountNumber.trim())
    errors.beneficiaryAccountNumber = 'Enter the beneficiary account number.'
  if (!state.bankName.trim()) errors.bankName = 'Select a bank name.'
  if (!state.accountType.trim()) errors.accountType = 'Select an account type.'

  if (!state.contactEmail.trim()) errors.contactEmail = 'Enter your contact email.'
  if (!state.dateOfDeath.trim()) errors.dateOfDeath = 'Select the date of death.'
  if (state.documents.length === 0) errors.documents = 'Upload at least one document.'

  if (
    state.contactEmail.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.contactEmail.trim())
  ) {
    errors.contactEmail = 'Enter a valid email address.'
  }

  return errors
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function App() {
  const [state, setState] = useState<FormState>(initialState)
  const [submitState, setSubmitState] = useState<SubmitState>({ type: 'idle' })
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({})

  const errors = useMemo(() => validate(state), [state])
  const statusRegionId = useId()

  function markTouched(name: keyof FormState) {
    setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }))
  }

  function fieldError(name: keyof FormState) {
    return touched[name] ? errors[name] : undefined
  }

  function onChangeText(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.currentTarget
    setState((prev) => ({ ...prev, [name]: value }))
  }

  function onChangeSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const { name, value } = e.currentTarget
    setState((prev) => ({ ...prev, [name]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    setTouched({
      mainMemberIdNumber: true,
      policyNumber: true,
      deceasedIdNumber: true,
      causeOfDeath: true,
      beneficiaryFirstName: true,
      beneficiarySurname: true,
      beneficiaryIdNumber: true,
      beneficiaryAccountNumber: true,
      bankName: true,
      accountType: true,
      contactEmail: true,
      dateOfDeath: true,
      documents: true,
    })

    const freshErrors = validate(state)
    if (Object.keys(freshErrors).length > 0) {
      setSubmitState({ type: 'error', message: 'Please fix the highlighted fields and try again.' })
      return
    }

    setSubmitState({ type: 'submitting' })
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: toFormData(state),
      })

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(text || `Request failed (${response.status})`)
      }

      setSubmitState({ type: 'success', message: 'Submitted successfully.' })
      setState(initialState)
      setTouched({})
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setSubmitState({
        type: 'error',
        message: `Submission failed. ${message}`.slice(0, 320),
      })
    }
  }

  const summary = submitState.type === 'error' ? submitState.message : null
  const causeError = fieldError('causeOfDeath')

  const docHelpId = useId()
  const deceasedIdInputId = useId()
  const deceasedIdHelpId = useId()
  const causeOptionBaseId = useId()
  const causeHelpId = useId()
  const bankHelpId = useId()
  const deathDateHelpId = useId()

  return (
    <div className="page">
      <div className="bgGlow" aria-hidden="true" />
      <main className="container">
        <header className="header">
          <div className="brandMark" aria-hidden="true" />
          <div>
            <h1 className="title">Claim assessment form</h1>
            <p className="subtitle">
              Complete the details below and upload the supporting documents. Fields marked with{' '}
              <span className="req">*</span> are required.
            </p>
          </div>
        </header>

        <section className="card" aria-label="Claim form">
          <form onSubmit={onSubmit} className="form" noValidate>
            {summary ? (
              <div className="alert alertError" role="alert">
                <div className="alertTitle">Check the form</div>
                <div className="alertBody">{summary}</div>
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
                  onBlur={() => markTouched('mainMemberIdNumber')}
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  error={fieldError('mainMemberIdNumber')}
                />
                <Field
                  label="Policy number"
                  name="policyNumber"
                  value={state.policyNumber}
                  onChange={onChangeText}
                  onBlur={() => markTouched('policyNumber')}
                  autoComplete="off"
                  required
                  error={fieldError('policyNumber')}
                />
              </div>
            </div>

            <div className="section">
              <h2 className="sectionTitle">Deceased details</h2>
              <div className="grid2">
                <div className="field">
                  <div className="labelRow">
                    <label className="label" htmlFor={deceasedIdInputId}>
                      Deceased ID number <span className="req">*</span>
                    </label>
                  </div>
                  <input
                    id={deceasedIdInputId}
                    name="deceasedIdNumber"
                    type="text"
                    className={fieldError('deceasedIdNumber') ? 'input inputError' : 'input'}
                    value={state.deceasedIdNumber}
                    onChange={onChangeText}
                    onBlur={() => markTouched('deceasedIdNumber')}
                    inputMode="numeric"
                    autoComplete="off"
                    aria-describedby={deceasedIdHelpId}
                    aria-invalid={fieldError('deceasedIdNumber') ? 'true' : undefined}
                    required
                  />
                  <div id={deceasedIdHelpId} className="help">
                    Provide the deceased person's ID number if available.
                  </div>
                  {fieldError('deceasedIdNumber') ? (
                    <div className="error">{fieldError('deceasedIdNumber')}</div>
                  ) : null}
                </div>
                <div className="field">
                  <div className="labelRow">
                    <label className="label">
                      Cause of death <span className="req">*</span>
                    </label>
                  </div>
                  <fieldset
                    className={causeError ? 'radioGroup radioGroupError' : 'radioGroup'}
                    aria-describedby={causeHelpId}
                  >
                    <legend className="srOnly">Cause of death</legend>
                    {(['Natural', 'Stillborn', 'Under Investigation', 'Un-natural'] as const).map(
                      (option) => (
                        <div
                          key={option}
                          className={
                            state.causeOfDeath === option ? 'radioCard radioCardChecked' : 'radioCard'
                          }
                          onClick={() => {
                            setState((prev) => ({ ...prev, causeOfDeath: option }))
                          }}
                        >
                          <input
                            id={`${causeOptionBaseId}-${toSlug(option)}`}
                            type="radio"
                            name="causeOfDeath"
                            value={option}
                            checked={state.causeOfDeath === option}
                            onChange={() => setState((prev) => ({ ...prev, causeOfDeath: option }))}
                            onBlur={() => markTouched('causeOfDeath')}
                          />
                          <label
                            className="radioText"
                            htmlFor={`${causeOptionBaseId}-${toSlug(option)}`}
                          >
                            {option}
                          </label>
                        </div>
                      ),
                    )}
                  </fieldset>
                  <div id={causeHelpId} className="help">
                    Select the option that best matches the available information.
                  </div>
                  {causeError ? <div className="error">{causeError}</div> : null}
                </div>
              </div>

              <div className="grid2">
                <div className="field">
                  <div className="labelRow">
                    <label className="label" htmlFor="dateOfDeath">
                      Date of death <span className="req">*</span>
                    </label>
                  </div>
                  <input
                    id="dateOfDeath"
                    name="dateOfDeath"
                    type="date"
                    className={fieldError('dateOfDeath') ? 'input inputError' : 'input'}
                    value={state.dateOfDeath}
                    onChange={onChangeText}
                    onBlur={() => markTouched('dateOfDeath')}
                    aria-describedby={deathDateHelpId}
                    aria-invalid={fieldError('dateOfDeath') ? 'true' : undefined}
                    required
                  />
                  <div id={deathDateHelpId} className="help">
                    Day, month, year.
                  </div>
                  {fieldError('dateOfDeath') ? (
                    <div className="error">{fieldError('dateOfDeath')}</div>
                  ) : null}
                </div>

                <Field
                  label="Your contact email"
                  name="contactEmail"
                  value={state.contactEmail}
                  onChange={onChangeText}
                  onBlur={() => markTouched('contactEmail')}
                  type="email"
                  autoComplete="email"
                  required
                  error={fieldError('contactEmail')}
                />
              </div>
            </div>

            <div className="section">
              <h2 className="sectionTitle">Beneficiary details</h2>
              <div className="grid2">
                <Field
                  label="Beneficiary first name"
                  name="beneficiaryFirstName"
                  value={state.beneficiaryFirstName}
                  onChange={onChangeText}
                  onBlur={() => markTouched('beneficiaryFirstName')}
                  autoComplete="given-name"
                  required
                  error={fieldError('beneficiaryFirstName')}
                />
                <Field
                  label="Beneficiary surname"
                  name="beneficiarySurname"
                  value={state.beneficiarySurname}
                  onChange={onChangeText}
                  onBlur={() => markTouched('beneficiarySurname')}
                  autoComplete="family-name"
                  required
                  error={fieldError('beneficiarySurname')}
                />
              </div>

              <div className="grid2">
                <Field
                  label="Beneficiary ID number"
                  name="beneficiaryIdNumber"
                  value={state.beneficiaryIdNumber}
                  onChange={onChangeText}
                  onBlur={() => markTouched('beneficiaryIdNumber')}
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  error={fieldError('beneficiaryIdNumber')}
                />
                <Field
                  label="Beneficiary account number"
                  name="beneficiaryAccountNumber"
                  value={state.beneficiaryAccountNumber}
                  onChange={onChangeText}
                  onBlur={() => markTouched('beneficiaryAccountNumber')}
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  error={fieldError('beneficiaryAccountNumber')}
                />
              </div>

              <div className="grid2">
                <div className="field">
                  <div className="labelRow">
                    <label className="label" htmlFor="bankName">
                      Bank name <span className="req">*</span>
                    </label>
                  </div>
                  <select
                    id="bankName"
                    name="bankName"
                    className={fieldError('bankName') ? 'input inputError' : 'input'}
                    value={state.bankName}
                    onChange={onChangeSelect}
                    onBlur={() => markTouched('bankName')}
                    aria-describedby={bankHelpId}
                    aria-invalid={fieldError('bankName') ? 'true' : undefined}
                    required
                  >
                    <option value="">Please select bank name</option>
                    {bankNames.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                  <div id={bankHelpId} className="help">
                    Select the beneficiary’s bank to help match the account.
                  </div>
                  {fieldError('bankName') ? <div className="error">{fieldError('bankName')}</div> : null}
                </div>

                <div className="field">
                  <div className="labelRow">
                    <label className="label" htmlFor="accountType">
                      Account type <span className="req">*</span>
                    </label>
                  </div>
                  <select
                    id="accountType"
                    name="accountType"
                    className={fieldError('accountType') ? 'input inputError' : 'input'}
                    value={state.accountType}
                    onChange={onChangeSelect}
                    onBlur={() => markTouched('accountType')}
                    aria-invalid={fieldError('accountType') ? 'true' : undefined}
                    required
                  >
                    <option value="">Please select account type</option>
                    <option value="Savings">Savings</option>
                    <option value="Current">Current</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                  {fieldError('accountType') ? (
                    <div className="error">{fieldError('accountType')}</div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="section">
              <h2 className="sectionTitle">Documents</h2>
              <div className="field">
                <div className="labelRow">
                  <label className="label" htmlFor="documents">
                    Upload documents <span className="req">*</span>
                  </label>
                </div>
                <input
                  id="documents"
                  name="documents"
                  type="file"
                  className="file"
                  multiple
                  accept="application/pdf,image/*"
                  onChange={(e) => {
                    const files = Array.from(e.currentTarget.files ?? [])
                    setState((prev) => ({ ...prev, documents: files }))
                  }}
                  onBlur={() => markTouched('documents')}
                  aria-describedby={docHelpId}
                  aria-invalid={fieldError('documents') ? 'true' : undefined}
                  required
                />
                <div id={docHelpId} className="help">
                  Death Certificate, Notice of Death, Beneficiary ID, Deceased ID, and a recent
                  beneficiary bank statement.
                </div>
                {fieldError('documents') ? <div className="error">{fieldError('documents')}</div> : null}

                {state.documents.length > 0 ? (
                  <div className="fileList" aria-label="Selected documents">
                    {state.documents.map((file) => (
                      <div key={`${file.name}-${file.lastModified}`} className="fileItem">
                        <div className="fileName">{file.name}</div>
                        <div className="fileMeta">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                    ))}
                  </div>
                ) : null}
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
                  setTouched({})
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
  onBlur?: () => void
  type?: React.HTMLInputTypeAttribute
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  autoComplete?: string
  error?: string
  describedBy?: string
  required?: boolean
}

function Field({
  label,
  name,
  value,
  onChange,
  onBlur,
  type = 'text',
  inputMode,
  autoComplete,
  error,
  describedBy,
  required,
}: FieldProps) {
  const id = useId()
  const errId = useId()

  return (
    <div className="field">
      <div className="labelRow">
        <label className="label" htmlFor={id}>
          {label}
          {required ? <span className="req"> *</span> : null}
        </label>
      </div>
      <input
        id={id}
        className={error ? 'input inputError' : 'input'}
        name={name}
        value={value}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={[describedBy, error ? errId : null].filter(Boolean).join(' ') || undefined}
        required={required}
      />
      {error ? (
        <div id={errId} className="error">
          {error}
        </div>
      ) : null}
    </div>
  )
}
