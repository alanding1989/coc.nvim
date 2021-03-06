import { Neovim } from '@chemzqm/neovim'
import snippetManager from '../../snippets/manager'
import helper from '../helper'

let nvim: Neovim
beforeAll(async () => {
  await helper.setup()
  nvim = helper.nvim
})

afterAll(async () => {
  await helper.shutdown()
})

afterEach(async () => {
  await helper.reset()
})

describe('snippet provider', () => {

  it('should not active insert plain snippet', async () => {
    let doc = await helper.createDocument()
    await snippetManager.insertSnippet('foo')
    let line = await nvim.line
    expect(line).toBe('foo')
    expect(snippetManager.session).toBe(null)
    expect(snippetManager.getSession(doc.bufnr)).toBeUndefined()
  })

  it('should goto next placeholder', async () => {
    await helper.createDocument()
    await snippetManager.insertSnippet('${1:a} ${2:b}')
    await snippetManager.nextPlaceholder()
    await helper.wait(30)
    let col = await nvim.call('col', '.')
    expect(col).toBe(3)
  })

  it('should goto previous placeholder', async () => {
    await helper.createDocument()
    await snippetManager.insertSnippet('${1:a} ${2:b}')
    await snippetManager.nextPlaceholder()
    await snippetManager.previousPlaceholder()
    let col = await nvim.call('col', '.')
    expect(col).toBe(1)
  })

  it('should remove kepmap on nextPlaceholder when session not exits', async () => {
    let doc = await helper.createDocument()
    await nvim.call('coc#snippet#enable')
    await snippetManager.nextPlaceholder()
    await helper.wait(60)
    let val = await doc.buffer.getVar('coc_snippet_active')
    expect(val).toBe(0)
  })

  it('should remove kepmap on previousPlaceholder when session not exits', async () => {
    let doc = await helper.createDocument()
    await nvim.call('coc#snippet#enable')
    await snippetManager.previousPlaceholder()
    await helper.wait(60)
    let val = await doc.buffer.getVar('coc_snippet_active')
    expect(val).toBe(0)
  })

  it('should update placeholder on placeholder update', async () => {
    await helper.createDocument()
    await nvim.setLine('bar')
    await snippetManager.insertSnippet('${1:foo} $1 ')
    let line = await nvim.line
    expect(line).toBe('foo foo bar')
    await helper.wait(60)
    await nvim.input('update')
    await helper.wait(200)
    line = await nvim.line
    expect(line).toBe('update update bar')
  })

  it('should check position on InsertEnter', async () => {
    await helper.createDocument()
    await nvim.input('ibar<left><left><left>')
    await snippetManager.insertSnippet('${1:foo} $1 ')
    await helper.wait(60)
    await nvim.input('<esc>A')
    await helper.wait(60)
    expect(snippetManager.session).toBeNull()
  })

  it('should cancel snippet session', async () => {
    let { buffer } = await helper.createDocument()
    await nvim.call('coc#snippet#enable')
    snippetManager.cancel()
    await helper.wait(60)
    let val = await buffer.getVar('coc_snippet_active')
    expect(val).toBe(0)
    let active = await snippetManager.insertSnippet('${1:foo}')
    expect(active).toBe(true)
    snippetManager.cancel()
    expect(snippetManager.session).toBeNull()
  })

  it('should dispose', async () => {
    await helper.createDocument()
    let active = await snippetManager.insertSnippet('${1:foo}')
    expect(active).toBe(true)
    snippetManager.dispose()
    expect(snippetManager.session).toBe(null)
  })

  it('should start new session if session exists', async () => {
    await helper.createDocument()
    await nvim.setLine('bar')
    await snippetManager.insertSnippet('${1:foo} ')
    await helper.wait(100)
    await nvim.input('<esc>')
    await nvim.command('stopinsert')
    await nvim.input('A')
    await helper.wait(100)
    let active = await snippetManager.insertSnippet('${2:bar}')
    expect(active).toBe(true)
    let line = await nvim.getLine()
    expect(line).toBe('foo barbar')
  })

  it('should start nest session', async () => {
    await helper.createDocument()
    await snippetManager.insertSnippet('${1:foo} ${2:bar}')
    await nvim.input('<backspace>')
    await helper.wait(100)
    let active = await snippetManager.insertSnippet('${1:x} $1')
    expect(active).toBe(true)
  })
})
