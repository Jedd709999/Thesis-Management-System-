def google_embed_link(google_url: str) -> str:
    if not google_url:
        return ''
    if '/edit' in google_url:
        return google_url.replace('/edit','/preview')
    return google_url
