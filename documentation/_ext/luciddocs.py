"""
Sphinx plugins for Lucid documentation.
Borrowed from Django
"""

import docutils.nodes
import docutils.transforms
import sphinx
import sphinx.addnodes
import sphinx.builder
import sphinx.directives
import sphinx.environment
import sphinx.htmlwriter

def setup(app):
    app.add_transform(SuppressBlockquotes)
    
    # Monkeypatch PickleHTMLBuilder so that it doesn't die in Sphinx 0.4.2
    if sphinx.__version__ == '0.4.2':
        monkeypatch_pickle_builder()
                
class SuppressBlockquotes(docutils.transforms.Transform):
    """
    Remove the default blockquotes that encase indented list, tables, etc.
    """
    default_priority = 300
    
    suppress_blockquote_child_nodes = (
        docutils.nodes.bullet_list, 
        docutils.nodes.enumerated_list, 
        docutils.nodes.definition_list,
        docutils.nodes.literal_block, 
        docutils.nodes.doctest_block, 
        docutils.nodes.line_block, 
        docutils.nodes.table
    )
    
    def apply(self):
        for node in self.document.traverse(docutils.nodes.block_quote):
            if len(node.children) == 1 and isinstance(node.children[0], self.suppress_blockquote_child_nodes):
                node.replace_self(node.children[0])

class LucidHTMLTranslator(sphinx.htmlwriter.SmartyPantsHTMLTranslator):
    """
    Lucid-specific reST to HTML tweaks.
    """

    # Don't use border=1, which docutils does by default.
    def visit_table(self, node):
        self.body.append(self.starttag(node, 'table', CLASS='docutils'))
    
    # <big>? Really?
    def visit_desc_parameterlist(self, node):
        self.body.append('(')
        self.first_param = 1
    
    def depart_desc_parameterlist(self, node):
        self.body.append(')')
        pass
        
    #
    # Don't apply smartypants to literal blocks
    #
    def visit_literal_block(self, node):
        self.no_smarty += 1
        sphinx.htmlwriter.SmartyPantsHTMLTranslator.visit_literal_block(self, node)
        
    def depart_literal_block(self, node):
        sphinx.htmlwriter.SmartyPantsHTMLTranslator.depart_literal_block(self, node) 
        self.no_smarty -= 1
        
    #
    # Turn the "new in version" stuff (versoinadded/versionchanged) into a
    # better callout -- the Sphinx default is just a little span,
    # which is a bit less obvious that I'd like.
    #
    # FIXME: these messages are all hardcoded in English. We need to chanage 
    # that to accomodate other language docs, but I can't work out how to make
    # that work and I think it'll require Sphinx 0.5 anyway.
    #
    version_text = {
        'deprecated':       'Deprecated in Lucid %s',
        'versionchanged':   'Changed in Lucid %s',
        'versionadded':     'New in Lucid %s',
    }
    
    def visit_versionmodified(self, node):
        self.body.append(
            self.starttag(node, 'div', CLASS=node['type'])
        )
        title = "%s%s" % (
            self.version_text[node['type']] % node['version'],
            len(node) and ":" or "."
        )
        self.body.append('<span class="title">%s</span> ' % title)
    
    def depart_versionmodified(self, node):
        self.body.append("</div>\n")
    
    # Give each section a unique ID -- nice for custom CSS hooks
    # This is different on docutils 0.5 vs. 0.4...
    
    # The docutils 0.4 override.
    if hasattr(sphinx.htmlwriter.SmartyPantsHTMLTranslator, 'start_tag_with_title'):
        def start_tag_with_title(self, node, tagname, **atts):
            node = {
                'classes': node.get('classes', []), 
                'ids': ['s-%s' % i for i in node.get('ids', [])]
            }
            return self.starttag(node, tagname, **atts)
            
    # The docutils 0.5 override.
    else:        
        def visit_section(self, node):
            old_ids = node.get('ids', [])
            node['ids'] = ['s-' + i for i in old_ids]
            sphinx.htmlwriter.SmartyPantsHTMLTranslator.visit_section(self, node)
            #node['ids'] = old_ids


def monkeypatch_pickle_builder():
    import shutil
    from os import path
    try:
        import cPickle as pickle
    except ImportError:
        import pickle
    from sphinx.util.console import bold
    
    def handle_finish(self):
        # dump the global context
        outfilename = path.join(self.outdir, 'globalcontext.pickle')
        f = open(outfilename, 'wb')
        try:
            pickle.dump(self.globalcontext, f, 2)
        finally:
            f.close()

        self.info(bold('dumping search index...'))
        self.indexer.prune(self.env.all_docs)
        f = open(path.join(self.outdir, 'searchindex.pickle'), 'wb')
        try:
            self.indexer.dump(f, 'pickle')
        finally:
            f.close()

        # copy the environment file from the doctree dir to the output dir
        # as needed by the web app
        shutil.copyfile(path.join(self.doctreedir, sphinx.builder.ENV_PICKLE_FILENAME),
                        path.join(self.outdir, sphinx.builder.ENV_PICKLE_FILENAME))

        # touch 'last build' file, used by the web application to determine
        # when to reload its environment and clear the cache
        open(path.join(self.outdir, sphinx.builder.LAST_BUILD_FILENAME), 'w').close()

    sphinx.builder.PickleHTMLBuilder.handle_finish = handle_finish
    
