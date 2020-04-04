import 'cypress-file-upload';

const evaluateOffset = (doc, selector, offsetType) => {
  return doc.querySelector(selector).getBoundingClientRect()[`${offsetType}`];
};

const isOnSameHorizontal = (firstElement, secondElement) =>
  (firstElement.top >= secondElement.top &&
    firstElement.bottom <= secondElement.bottom) ||
  (secondElement.top >= firstElement.top && secondElement.bottom <= firstElement.bottom);

const isOnSameVertical = (firstElement, secondElement) =>
  (firstElement.left >= secondElement.left &&
    firstElement.right <= secondElement.right) ||
  (secondElement.left >= firstElement.left && secondElement.right <= firstElement.right);

const isOverEachother = (backgroundElement, forefrontElement) => {
  backgroundElement.bottom = backgroundElement.top + backgroundElement.height;
  backgroundElement.right = backgroundElement.left + backgroundElement.width;

  forefrontElement.bottom = forefrontElement.top + forefrontElement.height;
  forefrontElement.right = forefrontElement.left + forefrontElement.width;

  return (
    isOnSameHorizontal(backgroundElement, forefrontElement) &&
    isOnSameVertical(backgroundElement, forefrontElement)
  );
};

describe('Meme generator', function() {
  const checkFullOverlappage = (backgroundSelector, forefrontSelector) => {
    cy.document().then(doc => {
      const backgroundElement = {
        top: evaluateOffset(doc, backgroundSelector, 'top'),
        height: evaluateOffset(doc, backgroundSelector, 'height'),
        left: evaluateOffset(doc, backgroundSelector, 'left'),
        width: evaluateOffset(doc, backgroundSelector, 'width'),
      };

      const forefrontElement = {
        top: evaluateOffset(doc, forefrontSelector, 'top'),
        height: evaluateOffset(doc, forefrontSelector, 'height'),
        left: evaluateOffset(doc, forefrontSelector, 'left'),
        width: evaluateOffset(doc, forefrontSelector, 'width'),
      };

      expect(isOverEachother(backgroundElement, forefrontElement)).to.be.true;

      // Text has volume
      expect(forefrontElement.top).to.not.be.undefined;
      expect(forefrontElement.bottom).to.not.be.undefined;
      expect(forefrontElement.left).to.not.be.undefined;
      expect(forefrontElement.right).to.not.be.undefined;
      expect(forefrontElement.right != forefrontElement.left).to.be.true;
      expect(forefrontElement.top != forefrontElement.bottom).to.be.true;
    });
  };

  const typeTextAndCheckItsPosition = () => {
    // It inserts text in the input and page when typed
    cy.get('#text-input')
      .type('My awesome meme')
      .should('have.value', 'My awesome meme');

    cy.contains(/^My awesome meme$/).should('be.visible');

    // Has one element inside another
    checkFullOverlappage('#meme-image-container', '#meme-text');
  };

  const memeUpload = () => {
    const fileName = 'meme.jpeg';
    cy.fixture(fileName).then(fileContent => {
      cy.get('#meme-insert').upload({
        fileContent,
        fileName,
        mimeType: 'image/jpeg',
      });
    });
  };

  it("O site deve possuir uma caixa de texto com a qual quem usa pode interagir para inserir texto em cima da imagem escolhida. A caixa de texto deve, necessariamente, ter um id denominado 'text-input'. O texto de quem usa deve ser inserido sobre a imagem escolhida. Se não houver imagem inserida, ele deve ser inserido sobre a área onde a imagem aparece na posição correta.", function() {
    cy.viewport(1366, 768);
    cy.visit('/');

    typeTextAndCheckItsPosition();
  });

  it('O site deve permitir que quem usa faça upload de uma imagem de seu computador. A imagem escolhida deve ocupar o espaço delimitado pela moldura, assim como seu texto.', function() {
    cy.viewport(1366, 768);
    cy.visit('/');

    memeUpload();
    cy.get('#meme-image').should('be.visible');
    typeTextAndCheckItsPosition();
  });

  it("O site deve ter uma moldura em volta da área onde a imagem aparecerá depois de ser escolhida. A moldura deve ter 1 pixel de largura, deve ser preta e do tipo 'solid'. A área onde a imagem aparecerá deve ter fundo branco.", function() {
    cy.viewport(1366, 768);
    cy.visit('/');
    cy.reload();

    // Image container has a white background
    cy.get('#meme-image-container').should($container => {
      expect($container).to.have.css('background-color', 'rgb(255, 255, 255)');
    });

    cy.get('#meme-image-container').should(
      'have.css',
      'border',
      '1px solid rgb(0, 0, 0)',
    );

    // Image is precisely inside it's container
    memeUpload();
    checkFullOverlappage('#meme-image-container', '#meme-image');
  });

  // Bonus requirements

  it("Permita a quem usa customizar o meme escolhido acrescentando a ele uma de três bordas. A página deve ter três botões, cada um colocando a própria borda ao redor da imagem. Um botão identificado com o id 'button1' deve estilizar o container da imagem com uma borda de 3 pixels, _dashed_ e vermelha. O botão com id 'button2' deve ser azul, borda _double_ de 5 pixels. O botão com id 'button3' deve ser verde com borda _groove_ com 6 pixels.", function() {
    cy.viewport(1366, 768);
    cy.visit('/');

    cy.get('#button1').click();
    cy.get('#meme-image-container').should(
      'have.css',
      'border',
      '3px dashed rgb(255, 0, 0)',
    );

    cy.get('#button2').click();
    cy.get('#meme-image-container').should(
      'have.css',
      'border',
      '5px double rgb(0, 0, 255)',
    );

    cy.get('#button3').click();
    cy.get('#meme-image-container').should(
      'have.css',
      'border',
      '6px groove rgb(0, 128, 0)',
    );
  });

  it("Tenha um conjunto de quatro imagens pré prontas de memes famosos para o usuário escolher. Liste miniaturas das imagens e, mediante clique do usuário, essa imagem deve aparecer dentro da moldura para ser customizada. O elemento clicável deve ser identificado um um id denominado 'meme-1' para o primeiro meme, 'meme-2' para o segundo, e assim por diante.", function() {
    cy.viewport(1366, 768);
    cy.visit('/');

    [1, 2, 3, 4].map(memeId => {
      cy.get(`#meme-${memeId}`).click();
      cy.get('#meme-image')
        .should('have.attr', 'src')
        .and('match', new RegExp(`imgs/meme${memeId}.jpeg$`));
    });
  });

  it('Limite o tamanho do texto que o usuário pode inserir. A quantidade máxima de caracteres deve ser 60.', function() {
    cy.get('#text-input')
      .type('I have written a line that has precisely sixty-one characters')
      .should(
        'have.value',
        'I have written a line that has precisely sixty-one character',
      );
  });
});
